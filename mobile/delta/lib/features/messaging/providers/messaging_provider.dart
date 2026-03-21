import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';
import '../repositories/messaging_repository.dart';
import '../services/socket_service.dart';

final conversationsProvider = FutureProvider.autoDispose<List<Conversation>>((ref) async {
  final repository = ref.watch(messagingRepositoryProvider);
  return repository.fetchConversations();
});

final currentConversationIdProvider = StateProvider<String?>((ref) => null);

class MessagesNotifier extends AutoDisposeAsyncNotifier<List<Message>> {
  StreamSubscription<Message>? _socketSubscription;

  @override
  FutureOr<List<Message>> build() async {
    final conversationId = ref.watch(currentConversationIdProvider);
    if (conversationId == null) return [];

    final repository = ref.watch(messagingRepositoryProvider);
    final messages = await repository.fetchMessages(conversationId);

    final socketService = ref.watch(socketServiceProvider);
    
    // Setup Socket connection
    socketService.connect().then((_) {
      socketService.joinConversation(conversationId);
    });

    _socketSubscription = socketService.onNewMessage.listen((newMessage) {
      if (newMessage.conversationId == conversationId) {
        state = AsyncData([...state.valueOrNull ?? [], newMessage]);
      }
    });

    ref.onDispose(() {
      socketService.leaveConversation(conversationId);
      _socketSubscription?.cancel();
    });

    return messages;
  }

  void sendMessage(String content) {
    final conversationId = ref.watch(currentConversationIdProvider);
    if (conversationId == null) return;
    
    final socketService = ref.read(socketServiceProvider);
    socketService.sendMessage(conversationId, content);
  }
}

final messagesProvider = AutoDisposeAsyncNotifierProvider<MessagesNotifier, List<Message>>(() {
  return MessagesNotifier();
});
