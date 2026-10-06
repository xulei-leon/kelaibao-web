import { PublicDetailPage } from "@/components/public-content-pages";
import {
  type PublicDetailPageProps,
} from "@/server/content/public-page";
import { createPublicDetailServerSideProps } from "@/server/content/public-page-server";

export const getServerSideProps =
  createPublicDetailServerSideProps("case");

export default function CaseDetailPage(props: PublicDetailPageProps) {
  return <PublicDetailPage {...props} />;
}
