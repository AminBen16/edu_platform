class SchoolOnboarding extends StatelessWidget {
  final TextEditingController controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Text("Create School"),
          TextField(controller: controller),
          ElevatedButton(
            onPressed: () {
              // call API to create school
            },
            child: Text("Continue"),
          ),
        ],
      ),
    );
  }
}
