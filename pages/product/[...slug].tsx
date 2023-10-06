import React, {useEffect, useRef, useState} from "react";
import Header from "../../components/header";
import NumberFormat from "react-number-format";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { addToBasket } from "../../slices/basketSlice";
import NotFound from "../404";
import { addToWishlist } from "../../slices/wishlistSlice";
import Productcard from "../../components/productcard";
import Head from "next/head";
import {ProductCollectionDocument, ProductCollectionQuery,
    ProductBySlugDocument, ProductBySlugQuery} from "@/saleor/api";
import {serverApolloClient} from "@/lib/auth/useAuthenticatedApolloClient";
import {ApolloQueryResult} from "@apollo/client/index";
import {useRegions} from "@/components/RegionsProvider";

function Product({ product, dataAlso, variantSKU }) {
  const dispatch = useDispatch();
    const { formatPrice } = useRegions();
  const [imgSelected, setImgSelected] = useState(0);

  if (!product || !dataAlso) return <NotFound />;

    const variants = product.variants || [];
    // variantMap = {“Color”:["Black","Blue"],"Size":[ "A5"], "Style":["Ruled","Dotted"]}
    const variantMap : Record<string, string[]> = variants.reduce((acc, variant) => {
        variant.selectionAttributes.forEach((attribute) => {
            const attributeName = attribute.attribute.name;
            const attributeValue = attribute.values[0].name;

            if (!acc[attributeName]) {
                acc[attributeName] = [attributeValue];
            } else if (!acc[attributeName].includes(attributeValue)) {
                acc[attributeName].push(attributeValue);
            }
        });

        return acc;
    }, {});

    // 初始化variantSelectedMap，选中的值，默认为每个变体项的第一个值
    const [variantSelectedMap, setVariantSelectedMap] = useState(() => {
        const map = {};
        for (const variant of variants) {
            if (variantSKU == null || variantSKU === variant.sku) {
                for (const attribute of variant.selectionAttributes) {
                    if (!map[attribute.attribute.name]) {
                        map[attribute.attribute.name] = attribute.values[0].name;
                    }
                }
            }
        }
        return map;
    });

    const [selectedVariantKey, setSelectedVariantKey] = useState(Object.values(variantSelectedMap).join("-"));
    // 把variantSelectedMap串起来作为key在variantInfoMap中取数据
    useEffect(() => {
        // 将variantSelectedMap的值串联起来赋值给selectedVariantKey
        const key = Object.values(variantSelectedMap).join("-");
        setSelectedVariantKey(key);

        if (variantSKU != null) {
            const newUrl = '/product/' + variantInfoMap[key].productSlug + '/' + variantInfoMap[key].sku + '/';
            if (window.location.pathname !== newUrl) {
                window.history.pushState(null, '', newUrl);
            }
        }
    }, [variantSelectedMap]);

    // 处理变体选择事件
    const handleVariantSelect = (attributeName, value) => {
        // 更新variantSelectedMap
        setVariantSelectedMap((prevMap) => ({
            ...prevMap,
            [attributeName]: value,
        }));
        // 切换变体后回到显示第一张图片
        setImgSelected(0);
    };

    // variantInfoMap的key是selectVariantKey
    const variantInfoMap = {};
    variants.forEach((variant) => {
        const attributes = variant.selectionAttributes;
        const tempVariantKey = Object.keys(variantMap)
            .map((attribute) => attributes.find((attr) => attr.attribute.name === attribute)?.values[0]?.name)
            .join("-");

        const variantInfo = { ...variant };
        variantInfo.productName = product.name;
        variantInfo.productSlug = product.slug;
        variantInfo.productVariantCount = product.variants.length;
        // 如果变体图片数组为空则使用产品图片数组
        if (!variantInfo.media || variantInfo.media.length === 0) {
            variantInfo.media = product.media;
        }

        variantInfoMap[tempVariantKey] = variantInfo;
    });

    // console.log(variantMap);
    // console.log(selectedVariantKey);
    // console.log(variantInfoMap);

    // 五点描述
    const pointObject = JSON.parse(product.description);
    const points = pointObject?.blocks[0]?.data?.items || [];

    const handleImageClick = () => {
        window.open(variantInfoMap[selectedVariantKey]["media"][imgSelected].url);
    };

    // 添加到购物车
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const handleAddToBasket = () => {
        setLoading(true);
        // 这里用 setTimeout 模拟异步操作
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            // 处理加入购物车逻辑
            dispatch(
                addToBasket(variantInfoMap[selectedVariantKey])
            );
            // 这里可以根据加入购物车成功与否设置 success 状态
            // setSuccess(result);
            // 2秒后恢复状态
            setTimeout(() => {
                setSuccess(false);
            }, 1000);
        }, 500);
    };

    const seoTitle = product.seoTitle || product.name;
    const seoDescription = product.seoDescription;

    let url = `https://www.eminstore.com/product/${product.slug}/`;
// 如果 variantSKU 不为 null，将其添加到 URL 中
    if (variantSKU !== null) {
        url += `${variantSKU}/`;
    }

  return (
    <>
      <Head>
          <title>{seoTitle}</title>
          <meta name="description" content={seoDescription} />

          <meta name="twitter:card" content="summary" />
          {/* 下面4个是和twitter共用的 */}
          <meta property="og:url" content={url} />
          <meta property="og:title" content={seoTitle} />
          <meta property="og:description" content={seoDescription} />
          <meta property="og:image" content={variantInfoMap[selectedVariantKey]["media"][0].url} />

          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="eminstore" />
      </Head>
      <div className="bg-cusgray min-h-screen pb-10">
        <Header />
        <div className="max-w-6xl mx-auto min-h-screen pt-16">
          <div className="flex justify-between place-items-center py-4 px-1 mb-4">
            <Link href="/shop">
              <div className="w-9 h-9 shadow-lg bg-white text-cusblack hover:bg-cusblack hover:text-white duration-200 cursor-pointer rounded-full flex justify-center place-items-center">
                <svg
                  className="w-4 h-4 "
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </div>
            </Link>
            <h4 className="text-cusblack text-md">Product Details</h4>
            <div className="w-8"></div>
          </div>

          <div className="w-full bg-white md:rounded-2xl shadow-lg md:py-8 md:px-10 md:flex">
            <div className="photo md:w-5/12">
                <div className="sticky top-16">
                    <div>
                        <img
                            // className=" h-60 object-cover w-full md:rounded-2xl"
                            className=" object-cover w-full md:rounded-2xl cursor-pointer"
                            src={variantInfoMap[selectedVariantKey]["media"][imgSelected].url}
                            alt=""
                            onClick={handleImageClick}
                        />
                    </div>
                    <div className="px-2 md:px-0 flex mt-4 overflow-x-auto whitespace-nowrap">
                        {variantInfoMap[selectedVariantKey]["media"].map((media, idx) => (
                            <img
                                key={idx}
                                src={media.url}
                                onClick={() => setImgSelected(idx)}
                                className={`${
                                    imgSelected == idx
                                        ? `border-2 border-cusblack filter brightness-90 `
                                        : ``
                                    } md:w-14 md:h-14 h-16 w-16 rounded-xl object-cover mr-3 cursor-pointer duration-100 `}
                                alt=""
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="detail px-2 md:px-0 mt-3 md:mt-0 md:ml-6 py-2 md:w-7/12">
              <h1 className="text-3xl text-cusblack font-medium mb-3">
                {product.name}
              </h1>
              <p className="text-sm text-gray-400">{product.category.name}</p>
              <p className="my-3 font-semibold text-lg text-cusblack">{formatPrice(variantInfoMap[selectedVariantKey].pricing?.price?.gross)}</p>
                {variants.length > 1 && (
                    <ul className="space-y-4">
                    {Object.entries(variantMap).map(([attributeName, values]) => (
                        <li className="sizes text-sm text-gray-400" key={attributeName}>
                            <p className="mb-2">{`Select ${attributeName}`}</p>
                            <div className="flex">
                                {values.map((value, idx) => (
                                    <button
                                        onClick={() => handleVariantSelect(attributeName, value)}
                                        key={idx}
                                        className={`${
                                            variantSelectedMap[attributeName] === value
                                                ? `bg-cusblack text-white`
                                                : `text-cusblack border border-cusblack`
                                            } mr-2 p-1 duration-200 flex place-items-center justify-center rounded-full min-w-12 h-12 cursor-pointer hover:bg-cusblack hover:text-white`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                        </li>
                    ))}
                </ul>
                    )}
              <div className="buttoncart flex mt-5 w-full">
                <button
                    onClick={handleAddToBasket}
                  className="w-4/5 md:w-3/5 bg-cusblack overflow-hidden py-4 text-white rounded-lg text-sm active:bg-gray-800 duration-100"
                >
                  <motion.span
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    className="flex justify-center place-items-center overflow-hidden"
                  >
                      {loading ? (
                          <span>Adding...</span>
                      ) : success ? (
                          <span>Added successfully</span>
                      ) : (
                          <>
                          Add to basket
                          <span>
                            <svg
                              className="ml-2 w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                            </svg>
                          </span>
                          </>
                          )}
                  </motion.span>
                </button>
                <button
                  onClick={() => dispatch(addToWishlist(product))}
                  className="w-1/5 ml-2 bg-white border border-cusblack py-4 text-cusblack rounded-lg text-sm"
                >
                  <svg
                    className="w-5 h-5 m-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
                {/*商品属性*/}
                <table className="w-full mt-6">
                    <tbody>
                    {[...product.attributes, ...variantInfoMap[selectedVariantKey].attributes].map((attribute, index) => (
                        attribute.values.length === 0 ? null : (
                        <tr
                            key={attribute.attribute.id}
                            className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}
                        >
                            <td className="py-2 px-4 font-medium text-gray-500 text-sm md:w-1/3 w-2/5">{attribute.attribute.name}</td>
                            <td className="py-2 px-4 font-normal text-gray-700 text-sm">{attribute.values[0].name}</td>
                        </tr>
                        )
                    ))}
                    </tbody>
                </table>
                {/*五点描述*/}
                <div className="mt-6">
                    <ul className="text-left list-disc ml-6 text-gray-700 text-sm">
                        {points.map((point, index) => (
                            <li key={index} className="mb-1"
                                dangerouslySetInnerHTML={{ __html: point }} />
                        ))}
                    </ul>
                </div>
            </div>
          </div>
          {/*图文详情*/}
            {product.desc && (
                <div className="text-cusblack p-2 md:px-10 md:py-6 mt-4 bg-white md:rounded-2xl shadow-lg">
                    <p className="mb-4 font-medium text-lg">Product Description</p>
                    <div dangerouslySetInnerHTML={{ __html: product.desc }}></div>
                </div>
            )}
          {/*商品推荐*/}
          <div className="text-cusblack p-2 md:px-10 md:py-6 mt-4 bg-white md:rounded-2xl shadow-lg">
              <p className="mb-4 font-medium text-lg">You may also like:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-x-4 gap-y-6">
                  {dataAlso
                      .filter((it, idx) => it.name != product.name)
                      .map((data, idx) => {
                          if (idx < 4)
                              return <Productcard key={data.slug} item={data} />;
                      })}
              </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticPaths() {
    // 所有商品
    const productResult: ApolloQueryResult<ProductCollectionQuery | undefined> =
        await serverApolloClient.query({
            query: ProductCollectionDocument,
            variables: { channel: 'default-channel', locale: 'EN_US' }
        });
    const productEdges = productResult.data?.products?.edges || [];
    const products = productEdges.map((edge) => edge.node);

    // 生成所有的URL
    const paths = products.reduce((allPaths, product) => {
        // 一个参数的URL
        allPaths.push({ params: { slug: [product.slug] } });

        // 两个参数的URL
        const variantSKUs = product.variants.map((variant) => variant.sku);
        variantSKUs.forEach((sku) => {
            allPaths.push({ params: { slug: [product.slug, sku] } });
        });

        return allPaths;
    }, []);
  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
    // 获取动态路由的参数
    const { slug } = params;
    const productSlug = slug[0];
    const variantSKU = slug.length === 2 ? slug[1] : null;

    // 查询商品详情
    const productDetailResult: ApolloQueryResult<ProductBySlugQuery | undefined> =
        await serverApolloClient.query({
            query: ProductBySlugDocument,
            variables: { slug: productSlug, channel: 'default-channel', locale: 'EN_US' }
        });
    const product = productDetailResult.data?.product;

    // console.log(JSON.stringify(productDetailResult));

    // “猜你喜欢”商品
    const productResult: ApolloQueryResult<ProductCollectionQuery | undefined> =
        await serverApolloClient.query({
            query: ProductCollectionDocument,
            variables: { channel: 'default-channel', locale: 'EN_US' }
        });
    const productEdges = productResult.data?.products?.edges || [];
    const products = productEdges.map((edge) => edge.node);
    // 打乱数组
    const dataAlso = products.sort(() => Math.random() - 0.5);

  //
  // const res = await fetch(
  //   process.env.NEXT_PUBLIC_APIURL + `/items?slug=${slug}`
  // );
  // const data = await res.json();
  // const dataItem = data[0];

  // if (!data.length) {
  //   return {
  //     redirect: {
  //       destination: "/shop",
  //       permanent: false,
  //     },
  //   };
  // }

  return {
    props: {
        product,
        dataAlso,
        variantSKU
    },
    revalidate: 5,
  };
}

export default Product;
