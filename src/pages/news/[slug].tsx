import { PublicDetailPage } from "@/components/public-content-pages";
import {
  type PublicDetailPageProps,
} from "@/server/content/public-page";
import { createPublicDetailServerSideProps } from "@/server/content/public-page-server";

export const getServerSideProps =
  createPublicDetailServerSideProps("news");

export default function NewsDetailPage(props: PublicDetailPageProps) {
  return <PublicDetailPage {...props} />;
}
