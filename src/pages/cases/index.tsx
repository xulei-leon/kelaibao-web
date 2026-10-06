import { PublicListPage } from "@/components/public-content-pages";
import {
  type PublicListPageProps,
} from "@/server/content/public-page";
import { createPublicListServerSideProps } from "@/server/content/public-page-server";

export const getServerSideProps =
  createPublicListServerSideProps("case");

export default function CasesPage(props: PublicListPageProps) {
  return <PublicListPage {...props} />;
}
