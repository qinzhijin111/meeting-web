
import PostMeetingSummary from "@/components/meeting/PostMeetingSummary";


type PageProps = {
  params: Promise<{
    roomId: string;
  }>;
};


export default async function SummaryPage({
  params,
}: PageProps) {
  const {
    roomId,
  } = await params;

  return (
    <PostMeetingSummary
      roomId={roomId}
    />
  );
}
