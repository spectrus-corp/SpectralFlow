import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Send } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/chat")({
  component: ChatPage,
  head: () => ({
    meta: [
      { title: "Messages — SpectralFlow" },
      {
        name: "description",
        content:
          "Discute en temps réel avec la communauté SpectralFlow via des messages privés synchronisés instantanément.",
      },
      { property: "og:title", content: "Messages — SpectralFlow" },
      {
        property: "og:description",
        content: "Conversations privées en temps réel sur SpectralFlow.",
      },
      { property: "og:url", content: "https://spectralflow.lovable.app/chat" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://spectralflow.lovable.app/chat" }],
  }),
});

interface ConversationView {
  id: string;
  other: { id: string; username: string; display_name: string | null; avatar_url: string | null };
  last_message_at: string;
}

interface MessageView {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

function ChatPage() {
  const { user } = useAuth();
  const [convs, setConvs] = useState<ConversationView[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [input, setInput] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select(
        "id,user_a,user_b,last_message_at,a:profiles!conversations_user_a_fkey(id,username,display_name,avatar_url),b:profiles!conversations_user_b_fkey(id,username,display_name,avatar_url)",
      )
      .order("last_message_at", { ascending: false });

    const mapped: ConversationView[] = (data ?? []).map((c: any) => ({
      id: c.id,
      last_message_at: c.last_message_at,
      other: c.user_a === user.id ? c.b : c.a,
    }));
    setConvs(mapped);
    setLoadingConvs(false);
    if (!activeId && mapped[0]) setActiveId(mapped[0].id);
  }, [user, activeId]);

  useEffect(() => {
    loadConvs();
  }, [loadConvs]);

  // Load messages when activeId changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setMessages(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Realtime messages
  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`msg-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageView]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !activeId || !input.trim()) return;
    const content = input.trim();
    setInput("");
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: activeId, sender_id: user.id, content });
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeId);
  };

  const active = convs.find((c) => c.id === activeId);

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <h1 className="sr-only">Messagerie SpectralFlow</h1>
      {/* Conversation list */}
      <aside className="flex w-72 flex-col border-r border-border bg-card/40 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h2 className="text-sm font-semibold">Conversations</h2>
          <NewChatDialog onCreated={(id) => { setActiveId(id); loadConvs(); }} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : convs.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">Aucune conversation. Crées-en une !</p>
          ) : (
            convs.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-accent ${
                  activeId === c.id ? "bg-accent" : ""
                }`}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={c.other.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/15 text-primary">
                    {(c.other.username ?? "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {c.other.display_name || c.other.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">@{c.other.username}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Conversation view */}
      <section className="flex flex-1 flex-col">
        {active ? (
          <>
            <header className="flex items-center gap-3 border-b border-border bg-card/40 px-4 py-3 backdrop-blur-xl">
              <Avatar className="h-9 w-9">
                <AvatarImage src={active.other.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/15 text-primary">
                  {active.other.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">
                  {active.other.display_name || active.other.username}
                </p>
                <p className="text-xs text-muted-foreground">@{active.other.username}</p>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2 border-t border-border bg-card/40 p-3 backdrop-blur-xl"
            >
              <label htmlFor="chat-message-input" className="sr-only">
                Nouveau message
              </label>
              <Input
                id="chat-message-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écris un message..."
                aria-label="Nouveau message"
              />
              <Button type="submit" size="icon" className="neon-glow" aria-label="Envoyer le message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Sélectionne ou crée une conversation.
          </div>
        )}
      </section>
    </div>
  );
}

function NewChatDialog({ onCreated }: { onCreated: (id: string) => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!user || !username.trim()) return;
    setBusy(true);
    const { data: target, error } = await supabase
      .from("profiles")
      .select("id,username")
      .eq("username", username.trim())
      .maybeSingle();

    if (error || !target) {
      setBusy(false);
      toast.error("Utilisateur introuvable");
      return;
    }
    if (target.id === user.id) {
      setBusy(false);
      toast.error("Tu ne peux pas te parler à toi-même");
      return;
    }
    const [a, b] = [user.id, target.id].sort();
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_a", a)
      .eq("user_b", b)
      .maybeSingle();

    let convId = existing?.id;
    if (!convId) {
      const { data: created, error: insErr } = await supabase
        .from("conversations")
        .insert({ user_a: a, user_b: b })
        .select("id")
        .single();
      if (insErr) {
        setBusy(false);
        toast.error(insErr.message);
        return;
      }
      convId = created.id;
    }
    setBusy(false);
    setOpen(false);
    setUsername("");
    onCreated(convId!);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Nouveau chat">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label htmlFor="new-chat-username" className="sr-only">
            Pseudo de l'utilisateur
          </label>
          <Input
            id="new-chat-username"
            placeholder="Pseudo de l'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label="Pseudo de l'utilisateur"
          />
          <Button onClick={create} disabled={busy} className="w-full">
            {busy ? "Création..." : "Démarrer la conversation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
