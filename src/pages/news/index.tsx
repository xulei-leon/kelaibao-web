import { PublicListPage } from "@/components/public-content-pages";
import {
  type PublicListPageProps,
} from "@/server/content/public-page";
import { createPublicListServerSideProps } from "@/server/content/public-page-server";

export const getServerSideProps =
  createPublicListServerSideProps("news");

export default function NewsPage(props: PublicListPageProps) {
  return <PublicListPage {...props} />;
}
