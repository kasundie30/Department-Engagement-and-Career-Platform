import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';

final messagingRepositoryProvider = Provider((ref) {
  final dio = ref.watch(messagingDioProvider);
  return MessagingRepository(dio);
});

class MessagingRepository {
  final Dio _dio;

  MessagingRepository(this._dio);

  Future<List<Conversation>> fetchConversations() async {
    try {
      final response = await _dio.get('/conversations');
      if (response.statusCode == 200) {
        final data = response.data as List;
        return data.map((json) => Conversation.fromJson(json)).toList();
      }
      throw Exception('Failed to load conversations');
    } catch (e) {
      throw Exception('Error fetching conversations: $e');
    }
  }

  Future<List<Message>> fetchMessages(String conversationId) async {
    try {
      final response = await _dio.get('/conversations/$conversationId/messages');
      if (response.statusCode == 200) {
        final data = (response.data['items'] ?? response.data ?? []) as List;
        return data.map((json) => Message.fromJson(json)).toList();
      }
      throw Exception('Failed to load messages');
    } catch (e) {
      throw Exception('Error fetching messages: $e');
    }
  }

  Future<Conversation> createDirectMessage(String participantId) async {
    try {
      final response = await _dio.post('/conversations/dm', data: {
        'participantId': participantId,
      });
      if (response.statusCode == 201 || response.statusCode == 200) {
        return Conversation.fromJson(response.data);
      }
      throw Exception('Failed to create DM');
    } catch (e) {
      throw Exception('Error creating DM: $e');
    }
  }
}
