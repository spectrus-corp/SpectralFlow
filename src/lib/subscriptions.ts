import { supabase } from "@/integrations/supabase/client";

export async function fetchFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("target_id")
    .eq("subscriber_id", userId);

  if (error) throw error;
  return (data ?? []).map((row: { target_id: string }) => row.target_id);
}

export async function toggleSubscription(
  userId: string,
  targetId: string,
  currentlyFollowing: boolean,
): Promise<boolean> {
  if (currentlyFollowing) {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .match({ subscriber_id: userId, target_id: targetId });
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from("subscriptions").insert({
    subscriber_id: userId,
    target_id: targetId,
  });
  if (error) throw error;
  return true;
}
