import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get appName => 'RideR Partner';
  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000/api/v1';
  static String get socketUrl => dotenv.env['SOCKET_URL'] ?? 'http://localhost:3000';
  static String get appVersion => '1.0.0';
  static String get appPlatform => 'driver';
  static const int requestTimeout = 30000;
  static const int locationUpdateInterval = 5000;
  static const double defaultMapLatitude = 19.0760;
  static const double defaultMapLongitude = 72.8777;
  static const double defaultMapZoom = 14.0;
}
