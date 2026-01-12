import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api.dart';

class RegistrationScreen extends ConsumerStatefulWidget {
  final String invitationCode;

  const RegistrationScreen({super.key, required this.invitationCode});

  @override
  ConsumerState<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends ConsumerState<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = true;
  bool _isRegistering = false;
  String? _error;
  Map<String, dynamic>? _invitation;

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _validateInvitation();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _validateInvitation() async {
    try {
      final data = await ApiService.validateInvitation(widget.invitationCode);
      setState(() {
        _invitation = data['invitation']; // Access the 'invitation' key
        _nameController.text = _invitation!['name'] ?? '';
        _emailController.text = _invitation!['email'] ?? '';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst(
          'Exception: ',
          '',
        ); // Clean up error message
        _isLoading = false;
      });
    }
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }

    setState(() {
      _isRegistering = true;
      _error = null;
    });

    try {
      await ApiService.register(
        _emailController.text,
        _passwordController.text,
        _nameController.text,
        widget.invitationCode,
      );

      if (!mounted) return;
      // After successful registration, navigate to the main screen or dashboard
      Navigator.of(context).pushReplacementNamed('/home');
    } catch (e) {
      if (!mounted) return;
      setState(
        () => _error = e.toString().replaceFirst('Exception: ', ''),
      ); // Clean up error message
    } finally {
      if (!mounted) return;
      setState(() => _isRegistering = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Validating invitation...'),
            ],
          ),
        ),
      );
    }

    if (_error != null && _invitation == null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error, size: 64, color: Colors.red),
                const SizedBox(height: 16),
                const Text(
                  'Invalid Invitation',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  _error!, // Display specific error message
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () =>
                      Navigator.of(context).pushReplacementNamed('/login'),
                  child: const Text('Go to Login'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Account'),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_invitation != null) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.indigo.withAlpha((255 * 0.1).round()),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.mail, size: 32, color: Colors.indigo),
                      const SizedBox(height: 8),
                      Text(
                        'You\'ve been invited to join as ${_invitation!['role']}',
                        style: TextStyle(
                          color: Colors.indigo[800],
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              TextFormField(
                controller: _nameController,
                enabled: _invitation?['name'] == null,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: Icon(Icons.person),
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _emailController,
                enabled: _invitation?['email'] == null,
                decoration: const InputDecoration(
                  labelText: 'Email Address',
                  prefixIcon: Icon(Icons.email),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your email';
                  }
                  if (!value.contains('@')) {
                    return 'Please enter a valid email';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(
                  labelText: 'Password',
                  prefixIcon: Icon(Icons.lock),
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a password';
                  }
                  if (value.length < 8) {
                    return 'Password must be at least 8 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _confirmPasswordController,
                decoration: const InputDecoration(
                  labelText: 'Confirm Password',
                  prefixIcon: Icon(Icons.lock_outline),
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please confirm your password';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),

              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withAlpha((255 * 0.1).round()),
                    border: Border.all(color: Colors.red),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error, color: Colors.red, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _error!,
                          style: TextStyle(color: Colors.red[800]),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              ElevatedButton(
                onPressed: _isRegistering ? null : _register,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isRegistering
                    ? const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          ),
                          SizedBox(width: 8),
                          Text('Creating Account...'),
                        ],
                      )
                    : const Text('Create Account'),
              ),
              const SizedBox(height: 16),

              TextButton(
                onPressed: () =>
                    Navigator.of(context).pushReplacementNamed('/login'),
                child: Text(
                  'Already have an account? Sign in',
                  style: TextStyle(color: Colors.indigo[600]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
