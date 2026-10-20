import type { GetStaticPropsContext } from "next";
import { PublicDetailPage } from "@/components/public-content-pages";
import { staticDetailPaths, staticDetailProps } from "@/lib/static-content-pages";

export function getStaticPaths() { return staticDetailPaths("case"); }
export function getStaticProps(context: GetStaticPropsContext) { return staticDetailProps("case", context.params?.slug); }
export default PublicDetailPage;
