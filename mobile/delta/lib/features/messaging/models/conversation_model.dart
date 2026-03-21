class Conversation {
  final String id;
  final List<dynamic> participants;
  final bool isGroup;
  final String? name;
  final DateTime createdAt;
  final DateTime updatedAt;

  Conversation({
    required this.id,
    required this.participants,
    required this.isGroup,
    this.name,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['_id'],
      participants: json['participants'] as List<dynamic>,
      isGroup: json['isGroup'] ?? false,
      name: json['name'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}
