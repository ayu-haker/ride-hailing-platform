import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';

final rideRequestTimerProvider = StateProvider<int>((ref) => 15);

class RideRequestPage extends ConsumerStatefulWidget {
  const RideRequestPage({super.key});

  @override
  ConsumerState<RideRequestPage> createState() => _RideRequestPageState();
}

class _RideRequestPageState extends ConsumerState<RideRequestPage> {
  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      final current = ref.read(rideRequestTimerProvider);
      if (current <= 1) {
        if (mounted) context.go('/home');
        return false;
      }
      ref.read(rideRequestTimerProvider.notifier).state = current - 1;
      return true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final timer = ref.watch(rideRequestTimerProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(timer),
            Expanded(child: _buildMapSection()),
            _buildRideRequestCard(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(int timer) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Text(
            'New Ride Request',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 18,
              color: timer > 10 ? AppTheme.textPrimary : Colors.red,
            ),
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: timer > 10 ? AppTheme.primaryColor : Colors.red,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '${timer}s',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
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
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.map_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 8),
            Text('Rider location & route', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _buildRideRequestCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              const CircleAvatar(
                radius: 28,
                backgroundColor: AppTheme.primaryColor,
                child: Icon(Icons.person, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Amit Sharma',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                    ),
                    SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.star, color: AppTheme.ratingColor, size: 16),
                        SizedBox(width: 4),
                        Text('4.5'),
                        SizedBox(width: 12),
                        Icon(Icons.directions_bike, size: 16),
                        SizedBox(width: 4),
                        Text('Bike'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.successColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  children: [
                    Text(
                      '₹25',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.successColor,
                        fontSize: 18,
                      ),
                    ),
                    Text(
                      'Est. fare',
                      style: TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Row(
            children: [
              Icon(Icons.location_on, color: AppTheme.successColor, size: 20),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Pickup', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                    Text('Bandra Kurla Complex', style: TextStyle(fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              Text('1.2 km', style: TextStyle(color: AppTheme.textSecondary)),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Divider(),
          ),
          const Row(
            children: [
              Icon(Icons.location_on, color: Colors.red, size: 20),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Drop', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                    Text('Lower Parel', style: TextStyle(fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              Text('8.5 km', style: TextStyle(color: AppTheme.textSecondary)),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => context.go('/home'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: Colors.red, width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text('Decline', style: TextStyle(color: Colors.red)),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: () => context.push('/ride/123'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: AppTheme.successColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text('Accept Ride'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
