import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/theme/app_theme.dart';

class RideTrackingPage extends ConsumerStatefulWidget {
  final String rideId;

  const RideTrackingPage({super.key, required this.rideId});

  @override
  ConsumerState<RideTrackingPage> createState() => _RideTrackingPageState();
}

class _RideTrackingPageState extends ConsumerState<RideTrackingPage> {
  String _rideStatus = 'searching';
  Timer? _statusTimer;
  bool _showSOS = false;

  @override
  void initState() {
    super.initState();
    _simulateRideFlow();
  }

  void _simulateRideFlow() {
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() => _rideStatus = 'driver_assigned');
        _showSOS = true;
      }
    });
    Future.delayed(const Duration(seconds: 8), () {
      if (mounted) setState(() => _rideStatus = 'arrived');
    });
    Future.delayed(const Duration(seconds: 12), () {
      if (mounted) setState(() => _rideStatus = 'in_progress');
    });
    Future.delayed(const Duration(seconds: 25), () {
      if (mounted) {
        setState(() => _rideStatus = 'completed');
        _showSOS = false;
        _showRateDialog();
      }
    });
  }

  void _showRateDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        title: const Text('Rate your ride'),
        content: const Text('How was your ride experience?'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.go('/home');
            },
            child: const Text('Skip'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.push('/ride/${widget.rideId}/rate');
            },
            child: const Text('Rate Now'),
          ),
        ],
      ),
    );
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) context.go('/home');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(),
            Expanded(child: _buildMapSection()),
            _buildRideStatusCard(),
            if (_rideStatus == 'searching') _buildSearchingIndicator(),
            if (_rideStatus == 'driver_assigned' || _rideStatus == 'arrived')
              _buildDriverInfo(),
            if (_rideStatus == 'in_progress') _buildTripInfo(),
            if (_rideStatus == 'completed') _buildCompletedCard(),
            if (_showSOS) _buildSOSButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.go('/home'),
          ),
          const Spacer(),
          Text(
            _getStatusText(),
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 16,
            ),
          ),
          const Spacer(),
          const SizedBox(width: 48),
        ],
      ),
    );
  }

  String _getStatusText() {
    switch (_rideStatus) {
      case 'searching': return 'Finding driver';
      case 'driver_assigned': return 'Driver assigned';
      case 'arrived': return 'Driver arrived';
      case 'in_progress': return 'On the way';
      case 'completed': return 'Ride completed';
      default: return 'Ride';
    }
  }

  Widget _buildMapSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.map, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 8),
            Text(
              'Live Map',
              style: TextStyle(color: Colors.grey[400], fontSize: 16),
            ),
            Text(
              'Ride ID: ${widget.rideId.substring(0, 8)}...',
              style: TextStyle(color: Colors.grey[400], fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchingIndicator() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        children: [
          const SizedBox(
            width: 40,
            height: 40,
            child: CircularProgressIndicator(strokeWidth: 3),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Finding nearby drivers',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Please wait...',
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDriverInfo() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 30,
            backgroundColor: AppTheme.primaryColor,
            child: Icon(Icons.person, color: Colors.white, size: 30),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Rajesh Kumar',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.star, color: AppTheme.ratingColor, size: 16),
                    const Text('4.5', style: TextStyle(fontSize: 14)),
                    const SizedBox(width: 12),
                    const Icon(Icons.directions_bike, size: 16, color: AppTheme.textSecondary),
                    const Text(' MH-01-AB-1234', style: TextStyle(fontSize: 14)),
                  ],
                ),
              ],
            ),
          ),
          Column(
            children: [
              IconButton(
                icon: const Icon(Icons.phone, color: AppTheme.primaryColor),
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.message, color: AppTheme.primaryColor),
                onPressed: () {},
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTripInfo() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Icon(Icons.location_on, color: AppTheme.successColor),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Bandra Kurla Complex',
                  style: TextStyle(fontSize: 14),
                ),
              ),
              Text(
                '10 min',
                style: TextStyle(
                  color: AppTheme.primaryColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.timer_outlined, color: AppTheme.textSecondary),
              const SizedBox(width: 12),
              Text(
                'Est. ₹85',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCompletedCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.successColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Row(
        children: [
          Icon(Icons.check_circle, color: Colors.white, size: 32),
          SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Ride completed!',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 18,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Total: ₹85.00',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSOSButton() {
    return Positioned(
      right: 16,
      bottom: 16,
      child: FloatingActionButton.large(
        onPressed: () {
          showDialog(
            context: context,
            builder: (_) => AlertDialog(
              title: const Text('Trigger SOS?'),
              content: const Text('Emergency alert will be sent to authorities.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  onPressed: () {
                    Navigator.pop(context);
                    context.push('/sos');
                  },
                  child: const Text('SOS'),
                ),
              ],
            ),
          );
        },
        backgroundColor: Colors.red,
        child: const Icon(Icons.warning, color: Colors.white, size: 32),
      ),
    );
  }

  @override
  void dispose() {
    _statusTimer?.cancel();
    super.dispose();
  }
}
