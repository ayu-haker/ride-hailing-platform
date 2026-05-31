import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/pages/login_page.dart';
import '../../features/auth/pages/otp_page.dart';
import '../../features/auth/pages/register_page.dart';
import '../../features/home/pages/home_page.dart';
import '../../features/booking/pages/pickup_page.dart';
import '../../features/booking/pages/dropoff_page.dart';
import '../../features/ride/pages/ride_tracking_page.dart';
import '../../features/wallet/pages/wallet_page.dart';
import '../../features/wallet/pages/add_money_page.dart';
import '../../features/profile/pages/profile_page.dart';
import '../../features/history/pages/ride_history_page.dart';
import '../../features/history/pages/ride_detail_page.dart';
import '../../features/coupons/pages/coupons_page.dart';
import '../../features/ratings/pages/rate_ride_page.dart';
import '../../features/sos/pages/sos_page.dart';
import '../../features/notifications/pages/notifications_page.dart';

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
            GoRoute(
              path: '/otp',
              name: 'otp',
              builder: (_, state) => OtpPage(
                phone: state.extra as String,
              ),
            ),
            GoRoute(
              path: '/register',
              name: 'register',
              builder: (_, state) => RegisterPage(
                phone: state.extra as String,
              ),
            ),
            ShellRoute(
              navigatorKey: _shellNavigatorKey,
              builder: (_, __, child) => HomeShell(child: child),
              routes: [
                GoRoute(
                  path: '/home',
                  name: 'home',
                  builder: (_, __) => const HomePage(),
                ),
                GoRoute(
                  path: '/wallet',
                  name: 'wallet',
                  builder: (_, __) => const WalletPage(),
                ),
                GoRoute(
                  path: '/profile',
                  name: 'profile',
                  builder: (_, __) => const ProfilePage(),
                ),
                GoRoute(
                  path: '/history',
                  name: 'history',
                  builder: (_, __) => const RideHistoryPage(),
                ),
              ],
            ),
            GoRoute(
              path: '/pickup',
              name: 'pickup',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const PickupPage(),
            ),
            GoRoute(
              path: '/dropoff',
              name: 'dropoff',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const DropoffPage(),
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
              path: '/add-money',
              name: 'add-money',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const AddMoneyPage(),
            ),
            GoRoute(
              path: '/ride/:id/rate',
              name: 'rate-ride',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, state) => RateRidePage(
                rideId: state.pathParameters['id']!,
              ),
            ),
            GoRoute(
              path: '/ride/:id/detail',
              name: 'ride-detail',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, state) => RideDetailPage(
                rideId: state.pathParameters['id']!,
              ),
            ),
            GoRoute(
              path: '/coupons',
              name: 'coupons',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const CouponsPage(),
            ),
            GoRoute(
              path: '/sos',
              name: 'sos',
              parentNavigatorKey: _rootNavigatorKey,
              builder: (_, __) => const SOSPage(),
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

class HomeShell extends StatelessWidget {
  final Widget child;

  const HomeShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _calculateIndex(),
        onTap: (index) => _onTabTap(context, index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.wallet_outlined),
            activeIcon: Icon(Icons.wallet),
            label: 'Wallet',
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

  int _calculateIndex() {
    final location = GoRouterState.of(
      (Router.of(_shellNavigatorKey.currentContext!)),
    ).uri.toString();
    if (location.startsWith('/wallet')) return 1;
    if (location.startsWith('/history')) return 2;
    if (location.startsWith('/profile')) return 3;
    return 0;
  }

  void _onTabTap(BuildContext context, int index) {
    switch (index) {
      case 0: context.go('/home');
      case 1: context.go('/wallet');
      case 2: context.go('/history');
      case 3: context.go('/profile');
    }
  }
}
