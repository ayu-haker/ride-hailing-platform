import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../features/auth/pages/login_page.dart';
import '../../../features/home/pages/home_page.dart';
import '../../../features/earnings/pages/earnings_page.dart';
import '../../../features/earnings/pages/daily_report_page.dart';
import '../../../features/earnings/pages/weekly_report_page.dart';
import '../../../features/ride/pages/ride_request_page.dart';
import '../../../features/ride/pages/ride_tracking_page.dart';
import '../../../features/wallet/pages/wallet_page.dart';
import '../../../features/wallet/pages/withdrawal_page.dart';
import '../../../features/profile/pages/profile_page.dart';
import '../../../features/history/pages/ride_history_page.dart';
import '../../../features/documents/pages/documents_page.dart';
import '../../../features/documents/pages/vehicle_registration_page.dart';
import '../../../features/notifications/pages/notifications_page.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

class AppRouter {
  final GoRouter router;

  AppRouter()
      : router = GoRouter(
          navigatorKey: _rootNavigatorKey,
          initialLocation: '/',
          routes: [
            GoRoute(
              path: '/',
              name: 'login',
              builder: (_, __) => const LoginPage(),
            ),
            ShellRoute(
              navigatorKey: _shellNavigatorKey,
              builder: (_, __, child) => DriverHomeShell(child: child),
              routes: [
                GoRoute(
                  path: '/home',
                  name: 'home',
                  builder: (_, __) => const HomePage(),
                ),
                GoRoute(
                  path: '/earnings',
                  name: 'earnings',
                  builder: (_, __) => const EarningsPage(),
                ),
                GoRoute(
                  path: '/history',
                  name: 'history',
                  builder: (_, __) => const RideHistoryPage(),
                ),
                GoRoute(
                  path: '/profile',
                  name: 'profile',
                  builder: (_, __) => const ProfilePage(),
                ),
              ],
            ),
            GoRoute(
              path: '/ride-request',
              name: 'ride-request',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const RideRequestPage(),
            ),
            GoRoute(
              path: '/ride/:id',
              name: 'ride-tracking',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, state) => RideTrackingPage(
                rideId: state.pathParameters['id']!,
              ),
            ),
            GoRoute(
              path: '/daily-report',
              name: 'daily-report',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const DailyReportPage(),
            ),
            GoRoute(
              path: '/weekly-report',
              name: 'weekly-report',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const WeeklyReportPage(),
            ),
            GoRoute(
              path: '/wallet',
              name: 'wallet',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const WalletPage(),
            ),
            GoRoute(
              path: '/withdrawal',
              name: 'withdrawal',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const WithdrawalPage(),
            ),
            GoRoute(
              path: '/documents',
              name: 'documents',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const DocumentsPage(),
            ),
            GoRoute(
              path: '/vehicle-registration',
              name: 'vehicle-registration',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const VehicleRegistrationPage(),
            ),
            GoRoute(
              path: '/notifications',
              name: 'notifications',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const NotificationsPage(),
            ),
          ],
        );
}

class DriverHomeShell extends StatelessWidget {
  final Widget child;

  const DriverHomeShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _calculateIndex(context),
        onTap: (index) => _onTabTap(context, index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.monetization_on_outlined),
            activeIcon: Icon(Icons.monetization_on),
            label: 'Earnings',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history_outlined),
            activeIcon: Icon(Icons.history),
            label: 'History',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outlined),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  int _calculateIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    if (location.startsWith('/earnings')) return 1;
    if (location.startsWith('/history')) return 2;
    if (location.startsWith('/profile')) return 3;
    return 0;
  }

  void _onTabTap(BuildContext context, int index) {
    switch (index) {
      case 0: context.go('/home');
      case 1: context.go('/earnings');
      case 2: context.go('/history');
      case 3: context.go('/profile');
    }
  }
}
