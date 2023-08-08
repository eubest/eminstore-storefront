import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import CardSkeleton from "../../components/cardskeleton";
import Layout from "../../components/layout";
import Productcard from "../../components/productcard";
import { recentCategory } from "../../slices/categorySlice";
import Head from "next/head";
import {
    CategoryPathsDocument,
    CategoryPathsQuery,
    CollectionPathsDocument,
    CollectionPathsQuery, ProductCollectionDocument, ProductCollectionQuery
} from "@/saleor/api";
import {serverApolloClient} from "@/lib/auth/useAuthenticatedApolloClient";
import {ApolloQueryResult} from "@apollo/client/index";

export async function getStaticProps({ params }) {
  const { slug } = params;
    // 所有分类
    const categorieResult: ApolloQueryResult<CategoryPathsQuery | undefined> =
        await serverApolloClient.query({
            query: CategoryPathsDocument,
            variables: {},
        });
    const categorieEdges = categorieResult.data?.categories?.edges || [];
    const data = categorieEdges.map((edge) => edge.node);

    // 所有集合
    const collectionResult: ApolloQueryResult<CollectionPathsQuery | undefined> =
        await serverApolloClient.query({
            query: CollectionPathsDocument,
            variables: {
                channel: "default-channel"
            },
        });
    const collectionEdges = collectionResult.data?.collections?.edges || [];
    const dataTypes = collectionEdges.map((edge) => edge.node);

    // 指定集合的所有商品
    const collectionId = dataTypes.find(item => item.slug === slug).id;
    const productResult: ApolloQueryResult<ProductCollectionQuery | undefined> =
        await serverApolloClient.query({
            query: ProductCollectionDocument,
            variables: { filter: {'collections':[collectionId]}, channel: 'default-channel', locale: 'EN_US' }
        });
    const productEdges = productResult.data?.products?.edges || [];
    const dataItems = productEdges.map((edge) => edge.node);

  return {
    props: {
      data,
      dataItems,
      dataTypes,
    },
    revalidate: 5,
  };
}

export async function getStaticPaths() {
    // 所有集合
    const collectionResult: ApolloQueryResult<CollectionPathsQuery | undefined> =
        await serverApolloClient.query({
            query: CollectionPathsDocument,
            variables: {
                channel: "default-channel"
            },
        });
    const collectionEdges = collectionResult.data?.collections?.edges || [];
    const dataTypes = collectionEdges.map((edge) => edge.node);

  const paths = dataTypes.map((dataType) => ({
    params: { slug: dataType.slug },
  }));

  return {
    paths,
    fallback: false,
  };
}

function Category({ data, dataItems, dataTypes }) {
  const [sort, setSort] = useState(0);
  const recent_category = useSelector(recentCategory);
  const data_items = dataItems
    .filter((item) => {
      if (recent_category.length > 0) {
          return item.category.name == recent_category;
      } else {
        return true;
      }
    })
    .sort((a, b) => {
      if (sort === 1) {
          return a.pricing.priceRange.start.gross.amount - b.pricing.priceRange.start.gross.amount;
      }
      if (sort === 2) {
          return b.pricing.priceRange.start.gross.amount - a.pricing.priceRange.start.gross.amount;
      }
      return true;
    });

  return (
    <>
      <Head>
        <title>eminstore | Shop</title>
      </Head>
      <Layout categories={data} setSort={setSort} types={dataTypes}>
        {data_items.length > 0 ? (
          data_items.map((item) => <Productcard key={item.slug} item={item} />)
        ) : (
          <p className="col-span-full mx-auto my-10 text-sm text-gray-400">
            No item found
          </p>
        )}
      </Layout>
    </>
  );
}

export default Category;
