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

// In Riverpod v3, StateProvider is replaced by NotifierProvider with a simple Notifier.
class CurrentConversationIdNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void set(String? id) => state = id;
}

final currentConversationIdProvider =
    NotifierProvider<CurrentConversationIdNotifier, String?>(
        CurrentConversationIdNotifier.new);

// In Riverpod v3, auto-dispose is the default; AutoDisposeAsyncNotifier → AsyncNotifier.
class MessagesNotifier extends AsyncNotifier<List<Message>> {
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
        state = AsyncData([...state.value ?? [], newMessage]);
      }
    });

    ref.onDispose(() {
      socketService.leaveConversation(conversationId);
      _socketSubscription?.cancel();
    });

    return messages;
  }

  void sendMessage(String content) {
    final conversationId = ref.read(currentConversationIdProvider);
    if (conversationId == null) return;

    final socketService = ref.read(socketServiceProvider);
    socketService.sendMessage(conversationId, content);
  }
}

// In Riverpod v3, AutoDisposeAsyncNotifierProvider → AsyncNotifierProvider.
final messagesProvider =
    AsyncNotifierProvider<MessagesNotifier, List<Message>>(
        MessagesNotifier.new);
