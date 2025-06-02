// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

/**
 * @title RideMatch Smart Contract
 * @dev Manages ride requests, driver matching, and payments for a decentralized rideshare application
 * Note: Complex algorithms like KNN and Dijkstra are implemented in a simplified form due to gas limitations
 */
contract RideMatch {
    // ======== State Variables ========
    address public owner;
    uint256 public rideCount;
    uint256 public driverCount;
    uint256 public platformFeePercent; // in basis points (e.g., 250 = 2.5%)
    
    // ======== Structs ========
    struct Location {
        int256 latitude;  // stored as int256 with 6 decimal precision (e.g., 40.712776 * 10^6)
        int256 longitude; // stored as int256 with 6 decimal precision (e.g., -74.005974 * 10^6)
    }
    
   
    struct Driver {
        uint256 id;
        address payable driverAddress;
        string name;
        uint256 rating;    // out of 1000 (e.g., 4.8 stars = 4800)
        string carModel;
        string licensePlate;
        Location location;
        bool isAvailable;
    }
    
    struct Passenger {
        address payable passengerAddress;
        string name;
        uint256 rating;    // out of 1000 (e.g., 4.8 stars = 4800)
    }
    
    struct RideRequest {
        uint256 id;
        address passenger;
        Location pickupLocation;
        Location destinationLocation;
        uint256 fare;
        uint256 timestamp;
        RideStatus status;
        uint256 assignedDriverId;
    }
    
    enum RideStatus { 
        Requested,   // Ride has been requested
        Matched,     // Driver has been matched
        InProgress,  // Ride is in progress
        Completed,   // Ride has been completed
        Cancelled    // Ride has been cancelled
    }
    
    // ======== Mappings ========
    mapping(uint256 => RideRequest) public rideRequests;
    mapping(uint256 => Driver) public drivers;
    mapping(address => Passenger) public passengers;
    mapping(address => uint256[]) public passengerRides;
    mapping(address => uint256[]) public driverRides;
    
    // ======== Events ========
    event DriverRegistered(uint256 driverId, address driverAddress, string name);
    event RideRequested(uint256 rideId, address passenger, int256 pickupLat, int256 pickupLng);
    event RideMatched(uint256 rideId, uint256 driverId, uint256 fare);
    event RideCompleted(uint256 rideId, uint256 fare);
    event RideCancelled(uint256 rideId);
    event DriverLocationUpdated(uint256 driverId, int256 latitude, int256 longitude);
    
    // ======== Constructor ========
    constructor() {
        owner = msg.sender;
        platformFeePercent = 250; // 2.5% platform fee
    }
    
    // ======== Modifiers ========
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyDriver(uint256 _driverId) {
        require(drivers[_driverId].driverAddress == msg.sender, "Only the assigned driver can call this function");
        _;
    }
    
    modifier onlyPassenger(uint256 _rideId) {
        require(rideRequests[_rideId].passenger == msg.sender, "Only the passenger can call this function");
        _;
    }
    
    // ======== Core Functions ========
    
    /**
     * @dev Register a new driver
     * @param _name Driver's name
     * @param _carModel Car model
     * @param _licensePlate License plate
     * @param _latitude Initial latitude (multiplied by 10^6)
     * @param _longitude Initial longitude (multiplied by 10^6)
     */
    function registerDriver(
        string memory _name,
        string memory _carModel,
        string memory _licensePlate,
        int256 _latitude,
        int256 _longitude
    ) external {
        driverCount++;
        drivers[driverCount] = Driver({
            id: driverCount,
            driverAddress: payable(msg.sender),
            name: _name,
            rating: 4500, // Default 4.5 stars
            carModel: _carModel,
            licensePlate: _licensePlate,
            location: Location(_latitude, _longitude),
            isAvailable: true
        });
        
        emit DriverRegistered(driverCount, msg.sender, _name);
    }
    
    /**
     * @dev Update driver location
     * @param _driverId Driver ID
     * @param _latitude New latitude (multiplied by 10^6)
     * @param _longitude New longitude (multiplied by 10^6)
     */
    function updateDriverLocation(
        uint256 _driverId,
        int256 _latitude,
        int256 _longitude
    ) external onlyDriver(_driverId) {
        drivers[_driverId].location = Location(_latitude, _longitude);
        emit DriverLocationUpdated(_driverId, _latitude, _longitude);
    }
    
    /**
     * @dev Set driver availability status
     * @param _driverId Driver ID
     * @param _isAvailable Availability status
     */
    function setDriverAvailability(uint256 _driverId, bool _isAvailable) external onlyDriver(_driverId) {
        drivers[_driverId].isAvailable = _isAvailable;
    }
    
    /**
     * @dev Request a new ride
     * @param _pickupLat Pickup latitude (multiplied by 10^6)
     * @param _pickupLng Pickup longitude (multiplied by 10^6)
     * @param _destLat Destination latitude (multiplied by 10^6)
     * @param _destLng Destination longitude (multiplied by 10^6)
     */
    function requestRide(
        int256 _pickupLat,
        int256 _pickupLng,
        int256 _destLat,
        int256 _destLng
    ) external payable {
        require(msg.value > 0, "Fare must be greater than 0");
        
        rideCount++;
        rideRequests[rideCount] = RideRequest({
            id: rideCount,
            passenger: msg.sender,
            pickupLocation: Location(_pickupLat, _pickupLng),
            destinationLocation: Location(_destLat, _destLng),
            fare: msg.value,
            timestamp: block.timestamp,
            status: RideStatus.Requested,
            assignedDriverId: 0
        });
        
        passengerRides[msg.sender].push(rideCount);
        
        emit RideRequested(rideCount, msg.sender, _pickupLat, _pickupLng);
    }
    
    /**
     * @dev Find the nearest available driver using a simplified KNN algorithm
     * @param _rideId Ride ID
     * @return driverId ID of the nearest driver
     */
    function findNearestDriver(uint256 _rideId) public view returns (uint256) {
        RideRequest storage ride = rideRequests[_rideId];
        require(ride.id > 0, "Ride does not exist");
        require(ride.status == RideStatus.Requested, "Ride is not in requested state");
        
        uint256 nearestDriverId = 0;
        uint256 shortestDistance = type(uint256).max;
        
        // Simplified KNN: Find the single nearest driver
        for (uint256 i = 1; i <= driverCount; i++) {
            Driver storage driver = drivers[i];
            
            if (driver.isAvailable) {
                // Calculate squared distance (to avoid sqrt which is expensive in Solidity)
                uint256 distance = calculateSquaredDistance(
                    ride.pickupLocation.latitude,
                    ride.pickupLocation.longitude,
                    driver.location.latitude,
                    driver.location.longitude
                );
                
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestDriverId = i;
                }
            }
        }
        
        return nearestDriverId;
    }
    
    /**
     * @dev Match a ride with the nearest driver
     * @param _rideId Ride ID
     */
    function matchRide(uint256 _rideId) external {
        RideRequest storage ride = rideRequests[_rideId];
        require(ride.id > 0, "Ride does not exist");
        require(ride.status == RideStatus.Requested, "Ride is not in requested state");
        
        uint256 driverId = findNearestDriver(_rideId);
        require(driverId > 0, "No available drivers found");
        
        ride.assignedDriverId = driverId;
        ride.status = RideStatus.Matched;
        
        driverRides[drivers[driverId].driverAddress].push(_rideId);
        
        emit RideMatched(_rideId, driverId, ride.fare);
    }
    
    /**
     * @dev Start a ride
     * @param _rideId Ride ID
     */
    function startRide(uint256 _rideId) external {
        RideRequest storage ride = rideRequests[_rideId];
        require(ride.id > 0, "Ride does not exist");
        require(ride.status == RideStatus.Matched, "Ride is not in matched state");
        require(drivers[ride.assignedDriverId].driverAddress == msg.sender, "Only the assigned driver can start the ride");
        
        ride.status = RideStatus.InProgress;
    }
    
    /**
     * @dev Complete a ride and transfer payment
     * @param _rideId Ride ID
     */
    function completeRide(uint256 _rideId) external {
        RideRequest storage ride = rideRequests[_rideId];
        require(ride.id > 0, "Ride does not exist");
        require(ride.status == RideStatus.InProgress, "Ride is not in progress");
        require(drivers[ride.assignedDriverId].driverAddress == msg.sender, "Only the assigned driver can complete the ride");
        
        ride.status = RideStatus.Completed;
        
        // Calculate platform fee
        uint256 platformFee = (ride.fare * platformFeePercent) / 10000;
        uint256 driverPayment = ride.fare - platformFee;
        
        // Transfer payment to driver
        payable(drivers[ride.assignedDriverId].driverAddress).transfer(driverPayment);
        
        // Platform fee goes to contract owner
        payable(owner).transfer(platformFee);
        
        emit RideCompleted(_rideId, ride.fare);
    }
    
    /**
     * @dev Cancel a ride
     * @param _rideId Ride ID
     */
    function cancelRide(uint256 _rideId) external onlyPassenger(_rideId) {
        RideRequest storage ride = rideRequests[_rideId];
        require(ride.id > 0, "Ride does not exist");
        require(ride.status == RideStatus.Requested || ride.status == RideStatus.Matched, "Ride cannot be cancelled");
        
        ride.status = RideStatus.Cancelled;
        
        // Refund passenger
        payable(ride.passenger).transfer(ride.fare);
        
        emit RideCancelled(_rideId);
    }
    
    /**
     * @dev Calculate squared distance between two points (simplified Haversine formula)
     * @param _lat1 Latitude of point 1
     * @param _lng1 Longitude of point 1
     * @param _lat2 Latitude of point 2
     * @param _lng2 Longitude of point 2
     * @return Squared distance between points
     */
    function calculateSquaredDistance(
        int256 _lat1,
        int256 _lng1,
        int256 _lat2,
        int256 _lng2
    ) internal pure returns (uint256) {
        // Simple squared Euclidean distance (not geographically accurate but gas-efficient)
        int256 latDiff = _lat1 - _lat2;
        int256 lngDiff = _lng1 - _lng2;
        
        // Convert to positive values (uint) for return
        uint256 latDiffAbs = latDiff < 0 ? uint256(-latDiff) : uint256(latDiff);
        uint256 lngDiffAbs = lngDiff < 0 ? uint256(-lngDiff) : uint256(lngDiff);
        
        return (latDiffAbs * latDiffAbs) + (lngDiffAbs * lngDiffAbs);
    }
    
    /**
     * @dev Simplified Dijkstra algorithm to find shortest path cost
     * Note: This is a highly simplified version due to gas limitations
     * In a real implementation, this would be done off-chain
     * @param _sourceDriverId Source driver ID
     * @param _destDriverId Destination driver ID
     * @param _maxDriversToCheck Maximum number of drivers to check (gas limit consideration)
     * @return Estimated path cost
     */
    function estimateShortestPathCost(
        uint256 _sourceDriverId,
        uint256 _destDriverId,
        uint256 _maxDriversToCheck
    ) external view returns (uint256) {
        require(_sourceDriverId > 0 && _sourceDriverId <= driverCount, "Invalid source driver");
        require(_destDriverId > 0 && _destDriverId <= driverCount, "Invalid destination driver");
        
        // If source and destination are the same, return 0
        if (_sourceDriverId == _destDriverId) {
            return 0;
        }
        
        // Limit the number of drivers to check to prevent out-of-gas errors
        uint256 driversToCheck = _maxDriversToCheck;
        if (driversToCheck > driverCount) {
            driversToCheck = driverCount;
        }
        
        // Initialize distances array
        uint256[] memory distances = new uint256[](driversToCheck + 1);
        bool[] memory visited = new bool[](driversToCheck + 1);
        
        // Set all initial distances to max value
        for (uint256 i = 1; i <= driversToCheck; i++) {
            distances[i] = type(uint256).max;
        }
        
        // Distance to source is 0
        distances[_sourceDriverId] = 0;
        
        // Simplified Dijkstra algorithm
        for (uint256 count = 1; count <= driversToCheck; count++) {
            // Find the minimum distance vertex from the set of vertices not yet processed
            uint256 minDistance = type(uint256).max;
            uint256 minIndex = 0;
            
            for (uint256 i = 1; i <= driversToCheck; i++) {
                if (!visited[i] && distances[i] <= minDistance) {
                    minDistance = distances[i];
                    minIndex = i;
                }
            }
            
            // If we can't find a next node or we've reached the destination, break
            if (minIndex == 0 || minIndex == _destDriverId) {
                break;
            }
            
            // Mark the picked vertex as processed
            visited[minIndex] = true;
            
            // Update distances of the adjacent vertices
            for (uint256 i = 1; i <= driversToCheck; i++) {
                // Skip if vertex is visited or is the same as current vertex
                if (visited[i] || i == minIndex) {
                    continue;
                }
                
                // Calculate distance between minIndex and i
                uint256 distance = calculateSquaredDistance(
                    drivers[minIndex].location.latitude,
                    drivers[minIndex].location.longitude,
                    drivers[i].location.latitude,
                    drivers[i].location.longitude
                );
                
                // Update distance if shorter path found
                if (distances[minIndex] != type(uint256).max && 
                    distances[minIndex] + distance < distances[i]) {
                    distances[i] = distances[minIndex] + distance;
                }
            }
        }
        
        // Return the distance to destination, or max value if no path found
        return distances[_destDriverId];
    }
    
  
    function getDriverDetails(uint256 _driverId) external view returns (
        uint256 id,
        address driverAddress,
        string memory name,
        uint256 rating,
        string memory carModel,
        string memory licensePlate,
        int256 latitude,
        int256 longitude,
        bool isAvailable
    ) {
        Driver storage driver = drivers[_driverId];
        require(driver.id > 0, "Driver does not exist");
        
        return (
            driver.id,
            driver.driverAddress,
            driver.name,
            driver.rating,
            driver.carModel,
            driver.licensePlate,
            driver.location.latitude,
            driver.location.longitude,
            driver.isAvailable
        );
    }
    
  
    function getRideDetails(uint256 _rideId) external view returns (
        uint256 id,
        address passenger,
        int256 pickupLat,
        int256 pickupLng,
        int256 destLat,
        int256 destLng,
        uint256 fare,
        uint256 timestamp,
        RideStatus status,
        uint256 assignedDriverId
    ) {
        RideRequest storage ride = rideRequests[_rideId];
        require(ride.id > 0, "Ride does not exist");
        
        return (
            ride.id,
            ride.passenger,
            ride.pickupLocation.latitude,
            ride.pickupLocation.longitude,
            ride.destinationLocation.latitude,
            ride.destinationLocation.longitude,
            ride.fare,
            ride.timestamp,
            ride.status,
            ride.assignedDriverId
        );
    }
    
    /**
     * @dev Update platform fee percentage
     * @param _newFeePercent New fee percentage in basis points
     */
    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 1000, "Fee cannot exceed 10%");
        platformFeePercent = _newFeePercent;
    }
}



