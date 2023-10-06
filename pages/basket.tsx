import Link from "next/link";
import React, { useEffect, useState } from "react";
import {useDispatch, useSelector} from "react-redux";
import BasketProduct from "../components/basketproduct";
import Header from "../components/header";
import { selectItems, deleteFromBasket } from "../slices/basketSlice";
import nookies from "nookies";
import Head from "next/head";
import { useRouter } from "next/dist/client/router";
import {PriceFragment,
    useCreateCheckoutMutation,
    useCheckoutShippingAddressUpdateMutation,
    useCheckoutEmailUpdateMutation,
    useOrderCreateMutation,
    useCheckoutShippingMethodUpdateMutation} from "@/saleor/api";
import {useRegions} from "@/components/RegionsProvider";
import {useUser} from "@/lib/useUser";
import Decimal from 'decimal.js';
// PayPal
import { PayPalButtons, usePayPalScriptReducer} from '@paypal/react-paypal-js';

function Basket() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { formatPrice, currentChannel } = useRegions();
    const tempItems = useSelector(selectItems);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cookie, setCookie] = useState({});

    const [createCheckout] = useCreateCheckoutMutation();
    const [updateCheckoutShippingMethod] = useCheckoutShippingMethodUpdateMutation();
    const [updateCheckoutEmail] = useCheckoutEmailUpdateMutation();
    const [updateCheckoutShippingAddress] = useCheckoutShippingAddressUpdateMutation();
    const [createOrder] = useOrderCreateMutation();
    const { user } = useUser();

    const [{ isPending }] = usePayPalScriptReducer();

    useEffect(() => {
        const dataCookie = nookies.get();
        try {
            setCookie(JSON.parse(dataCookie.user));
        } catch (err) {
            setCookie(dataCookie.user);
        }
        setTimeout(() => setLoading(false), 500);
    }, []);

    useEffect(() => {
        setItems(tempItems);
    }, [tempItems]);

    const createCheckoutSession2 = async () => {
        setLoading(true);

        const lines = items.map(item => ({
            quantity: item.quantity,
            variantId: item.id,
        }));

        const { data: createCheckoutData } = await createCheckout({
            variables: {
                email: user?.email,
                channel: currentChannel.slug,
                lines: lines,
            },
        });

        const errorMessages = createCheckoutData?.checkoutCreate?.errors.map((e) => e.message || "") || [];
        if (errorMessages.length === 0) {
            const checkoutUrl = new URL(`https://www.eminstore.com/checkout/`);
            checkoutUrl.searchParams.append('checkout', createCheckoutData?.checkoutCreate?.checkout?.id);
            checkoutUrl.searchParams.append('locale', `en-US`);
            checkoutUrl.searchParams.append('channel', `default-channel`);
            checkoutUrl.searchParams.append('saleorApiUrl', process.env.NEXT_PUBLIC_API_URI!);
            window.location.href = checkoutUrl.toString();
        } else {
            alert(errorMessages.join("\n"));
        }
    };

    let checkoutId = null;
    let checkoutToken = null;
    const createCheckoutSession = async () => {
        const lines = items.map(item => ({
            quantity: item.quantity,
            variantId: item.id,
        }));

        const { data: createCheckoutData } = await createCheckout({
            variables: {
                email: user?.email,
                channel: currentChannel.slug,
                lines: lines,
            },
        });

        const errorMessages = createCheckoutData?.checkoutCreate?.errors.map((e) => e.message || "") || [];
        if (errorMessages.length > 0) {
            alert(errorMessages.join("\n"));
        }

        checkoutId = createCheckoutData?.checkoutCreate?.checkout?.id;
        checkoutToken = createCheckoutData?.checkoutCreate?.checkout?.token;
    };

    // 更新checkout的送货方式
    const updateCheckoutShippingMethodSession = async () => {
        // U2hpcHBpbmdNZXRob2Q6Mg== 是0元
        // U2hpcHBpbmdNZXRob2Q6MQ== 是8元
        let methodId = "U2hpcHBpbmdNZXRob2Q6MQ==";
        if (getRemainingAmountForFreeShipping() === 0) {
            methodId = "U2hpcHBpbmdNZXRob2Q6Mg==";
        }

        const { data } = await updateCheckoutShippingMethod({
            variables: {
                token: checkoutToken,
                shippingMethodId: methodId,
                locale: 'EN_US',
            },
        });
        if (data?.checkoutShippingMethodUpdate?.errors.length) {
            console.log(data?.checkoutShippingMethodUpdate?.errors);
            return false;
        }
        return true;
    };

    // 更新checkout的收货地址
    const updateCheckoutShippingAddressSession = async (shippingInfo) => {
        const { data } = await updateCheckoutShippingAddress({
            variables: {
                address: {
                    firstName: shippingInfo?.name?.full_name?.split(' ')[0] || "",
                    lastName: shippingInfo?.name?.full_name?.split(' ')[1] || "",
                    phone: "", // 无
                    country: shippingInfo?.address?.country_code || "US",
                    countryArea: shippingInfo?.address?.admin_area_1 || "",
                    city: shippingInfo?.address?.admin_area_2 || "",
                    streetAddress1: shippingInfo?.address?.address_line_1 || "",
                    postalCode: shippingInfo?.address?.postal_code || "",
                },
                token: checkoutToken,
                locale: 'EN_US',
            },
        });
        if (data?.checkoutShippingAddressUpdate?.errors.length) {
            console.log(data?.checkoutShippingAddressUpdate?.errors);
            return false;
        }
        return true;
    };

    // 更新checkout的邮箱
    const updateCheckoutEmailSession = async (email) => {
        const { data } = await updateCheckoutEmail({
            variables: {
                email: email,
                token: checkoutToken,
                locale: 'EN_US',
            },
        });
        if (data?.checkoutEmailUpdate?.errors.length) {
            console.log(data?.checkoutEmailUpdate?.errors);
            return false;
        }
        return true;
    };

    // 新建订单
    const createOrderSession = async () => {
        const { data } = await createOrder({
            variables: {
                id: checkoutId,
            },
        });
        if (!data?.orderCreateFromCheckout?.order) {
            alert("Network error. Please try again."); // 提示网络异常
            return null;
        }
        return data?.orderCreateFromCheckout?.order;
    };

    // 计算单个商品总价格
    const calculateProductTotalPrice = (item) => {
        const amount = new Decimal(item.pricing?.price?.gross.amount || 0);
        return amount.times(item.quantity);
    };
    const calculateProductTotalPriceStr = (item) => {
        return formatPrice({ amount: calculateProductTotalPrice(item).toNumber() } as PriceFragment);
    };

    // 计算运费
    const calculateOrderShippingCost = (cartTotalPrice?) => {
        if (!cartTotalPrice) {
            cartTotalPrice = calculateCartTotalPrice();
        }
        if (cartTotalPrice.toNumber() == 0 || cartTotalPrice.toNumber() >= freeShippingThreshold) {
            return new Decimal(0);
        }
        return new Decimal(shippingCost);
    };
    const calculateOrderShippingCostStr = () => {
        return formatPrice({ amount: calculateOrderShippingCost().toNumber() } as PriceFragment);
    };

    // 计算购物车中所有商品的总价格
    const calculateCartTotalPrice = () => {
        let totalPrice = new Decimal(0);
        for (const item of items) {
            totalPrice = totalPrice.plus(calculateProductTotalPrice(item));
        }
        return totalPrice;
    };
    const calculateCartTotalPriceStr = () => {
        return formatPrice({ amount: calculateCartTotalPrice().toNumber() } as PriceFragment);
    };
    // 计算购物车中所有商品+税+运费的总价格
    const calculateTotalPrice = () => {
        let totalPrice = calculateCartTotalPrice();
        return totalPrice.plus(calculateOrderShippingCost(totalPrice));
    };
    const calculateTotalPriceStr = () => {
        return formatPrice({ amount: calculateTotalPrice().toNumber() } as PriceFragment);
    };

    // TODO ... 这些变量需要从后台查出
    const freeShippingThreshold = 49.0; // 满多少免运费
    const shippingCost = 8.0; // 不免运费时的运费

    const getRemainingAmountForFreeShipping = () => {
        let totalPrice = calculateCartTotalPrice();

        const remainingAmount = new Decimal(freeShippingThreshold).minus(totalPrice);
        return remainingAmount.greaterThanOrEqualTo(0) ? remainingAmount.toNumber() : 0;
    };

    const [promoCode, setPromoCode] = useState('');

    const handleInputChange = (event) => {
        setPromoCode(event.target.value.toUpperCase());
    };

    const seoTitle = "Your Shopping Cart - Eminstore | Review and Checkout Your Items";
    const seoDescription = "Review and checkout items in your shopping cart at Eminstore. Explore the products you've selected and complete your purchase with ease.";

    return (
        <>
            <Head>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDescription} />

                <meta name="twitter:card" content="summary" />
                {/* 下面4个是和twitter共用的 */}
                <meta property="og:url" content="https://www.eminstore.com/basket/" />
                <meta property="og:title" content={seoTitle} />
                <meta property="og:description" content={seoDescription} />
                <meta property="og:image" content="https://www.eminstore.com/eminstore.png" />

                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="eminstore" />
            </Head>
            <div className="w-full min-h-screen relative bg-cusgray pb-10">
                <Header />
                <div className="max-w-6xl mx-auto pt-20 px-5">
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-x-4">
                        <div className="md:col-span-2 md:mr-5">
                            <div className="">
                                <div className="shadow-lg rounded-xl bg-cusblack text-white px-5 py-3">
                                    <h1 className="font-semibold text-lg md:text-xl mb-1">
                                        {getRemainingAmountForFreeShipping() == 0
                                            ? "Your order qualifies for FREE SHIPPING"
                                            : `Order for an additional $${getRemainingAmountForFreeShipping()} to receive FREE SHIPPING`}
                                    </h1>
                                    <p className="text-xs mb-1 text-gray-100">
                                        Free shipping on orders over $49. Orders ship within 3-7 business days.
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white px-5 pt-5 mt-5 shadow-lg overflow-hidden">
                                    <p>Your Basket ({items.length})</p>
                                    <div className="pt-5 pb-2">
                                        {items.length > 0 &&
                                        items.map((item, idx) => (
                                            <BasketProduct idx={idx} key={item.id} item={item} />
                                        ))}
                                        {items.length === 0 && (
                                            <div className="text-gray-400 text-sm mb-10">
                                                <img
                                                    className="md:w-1/3 object-cover w-full mx-auto"
                                                    src="\empty-cart.png"
                                                    alt=""
                                                />
                                                <p className="text-center">
                                                    Your basket is empty,
                                                    <br />
                                                    to start shopping click{" "}
                                                    <span className="underline">
                            <Link href="/shop">here</Link>
                          </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 md:mt-0 col-span-1">
                            <div className="rounded-xl bg-white shadow-lg py-6 px-5">
                                <h1 className="text-cusblack font-bold text-md">SUMMARY</h1>
                                <div className="px-4 py-2.5 text-xs font-medium flex place-items-center text-gray-400 border border-gray-200 rounded-md my-4">
                                    <svg
                                        className="w-5 h-5 transform scale-110 mr-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                                        />
                                    </svg>
                                    <input
                                        type="text"
                                        className={`border-0 bg-transparent w-full py-1 font-medium placeholder-gray-400 focus:outline-none`}
                                        placeholder="DO YOU HAVE PROMO CODE?"
                                        value={promoCode}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="text-sm pt-1 font-semibold pb-2 border-b flex justify-between place-items-center">
                                    <p className="">SUBTOTAL</p>
                                    <p className="font-semibold text-right text-cusblack">{ calculateCartTotalPriceStr() }</p>
                                </div>

                                <div className="my-3 border-b pb-2">
                                    {items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex justify-between place-items-center text-sm mb-1"
                                        >
                                            <p className="pr-3">{item.productName}{item.productVariantCount > 1 ? `（${item.name}）` : ''}</p>
                                            <p className="text-right text-cusblack">{ calculateProductTotalPriceStr(item) }</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="my-3 border-b border-cusblack pb-2 font-semibold">
                                    <div className="flex justify-between place-items-center text-sm mb-1">
                                        <p>SHIPPING COST</p>
                                        {calculateOrderShippingCost().toNumber() == 0 ? (
                                            <p className="text-right text-cusblack">FREE</p>
                                        ) : (
                                            <p className="font-semibold text-right text-cusblack">{calculateOrderShippingCostStr()}</p>
                                        )}
                                    </div>
                                    <div className="flex justify-between place-items-center text-sm mb-1">
                                        <p>TAX</p>
                                        <p className="text-right text-cusblack">FREE</p>
                                    </div>
                                </div>
                                <div className="flex justify-between place-items-center font-semibold mb-4">
                                    <p>TOTAL</p>
                                    <p className="font-semibold text-right text-cusblack">{ calculateTotalPriceStr() }</p>
                                </div>

                                {/*<button*/}
                                {/*disabled={!items.length}*/}
                                {/*onClick={createCheckoutSession2}*/}
                                {/*className="py-2 px-3 disabled:cursor-not-allowed text-white w-full mt-6 rounded-lg bg-cusblack "*/}
                                {/*>*/}
                                {/*{!loading ? (*/}
                                {/*<span className="flex justify-center place-items-center">*/}
                                {/*CHECKOUT*/}
                                {/*</span>*/}
                                {/*) : (*/}
                                {/*<img*/}
                                {/*className="w-6 h-6 mx-auto"*/}
                                {/*src="/Rolling-1s-200px-2.gif"*/}
                                {/*alt=""*/}
                                {/*/>*/}
                                {/*)}*/}
                                {/*</button>*/}

                                {/* PayPal Express Checkout */}
                                {items.length > 0 && !isPending && (
                                    <PayPalButtons
                                        data-page-type="cart"
                                        style={{ color: "blue", label: "checkout" }}
                                        forceReRender={[items]}
                                        onClick={async (data, actions) => {
                                            // 点击按钮逻辑
                                            // 1.创建checkout
                                            await createCheckoutSession(); // 创建checkout
                                            if (!checkoutId || !checkoutToken) {
                                                return actions.reject(); // 关闭
                                            }
                                            console.log("onClick data:", data);
                                            console.log("onClick actions:", actions);
                                        }}
                                        createOrder={(data, actions) => {
                                            const paypalOrder = {
                                                purchase_units: [
                                                    {
                                                        amount: {
                                                            currency_code: "USD",
                                                            value: calculateTotalPrice().toFixed(2), // 使用总金额，并四舍五入到两位小数
                                                            breakdown: {
                                                                item_total: {
                                                                    currency_code: "USD",
                                                                    value: calculateCartTotalPrice().toFixed(2), // 使用总金额，并四舍五入到两位小数
                                                                },
                                                                shipping: {
                                                                    currency_code: "USD",
                                                                    value: calculateOrderShippingCost().toFixed(2),
                                                                },
                                                            },
                                                        },
                                                        items: [],
                                                    },
                                                ],
                                            };
                                            // 遍历items并添加到createOrderInfo中
                                            for (const item of items) {
                                                const itemInfo = {
                                                    name: item.productName + (item.productVariantCount > 1 ? '（' + item.name + '）' : ''),
                                                    quantity: item.quantity.toString(),
                                                    unit_amount: {
                                                        currency_code: item.pricing.price.gross.currency,
                                                        value: item.pricing.price.gross.amount.toFixed(2)
                                                    },
                                                };
                                                paypalOrder.purchase_units[0].items.push(itemInfo);
                                            }

                                            return actions.order.create(paypalOrder);
                                        }}
                                        onApprove={async (data, actions) => {
                                            // 该方法被调用，说明用户已经在 PayPal 上成功完成了支付，并且支付订单已被批准
                                            // 1.查询支付信息（为了获取到收货地址）
                                            const details = await actions.order.capture();
                                            // 2.更新checkout
                                            // 2.1.更新送货地址
                                            const shippingInfo = details?.purchase_units[0]?.shipping;
                                            await updateCheckoutShippingAddressSession(shippingInfo);
                                            // 2.2.更新checkout的email（因为要发邮件给买家，所以这很重要）
                                            await updateCheckoutEmailSession(details?.payer?.email_address || "");
                                            // await updateCheckoutEmailSession("1143079030@qq.com"); // 测试用
                                            // await updateCheckoutEmailSession("emintech123@gmail.com"); // 测试用
                                            // 2.3.更新快递方式
                                            await updateCheckoutShippingMethodSession();
                                            // 3.创建订单
                                            const orderData = await createOrderSession();

                                            // 5.跳转至订单详情页面
                                            // Construct the URL with the orderId and other parameters
                                            if (orderData) {
                                                // 清空购物车
                                                dispatch(deleteFromBasket(orderData.id));

                                                const orderId = orderData.id;
                                                const baseUrl = '/checkout/';
                                                const domain = 'www.eminstore.com';
                                                const locale = 'en-US';
                                                const saleorApiUrl = encodeURIComponent('https://data.eminstore.com/graphql/');

                                                // Perform the page redirection
                                                window.location.href = `${baseUrl}?domain=${domain}&locale=${locale}&order=${orderId}&saleorApiUrl=${saleorApiUrl}`;
                                            }
                                        }}
                                        onError={(error) => {
                                            console.log("PayPal error:", error);
                                        }}
                                        onCancel={(data) => {
                                            // 取消支付逻辑
                                            console.log("onCancel data:", data);
                                        }}
                                        onShippingChange={(data, actions) => {
                                            // 送货地址变更逻辑
                                            console.log("onShippingChange data:", data);
                                            // 限定送货地址为美国
                                            if (data.shipping_address.country_code !== 'US') {
                                                return actions.reject(); // 向PayPal表示您将不支持买家提供的送货地址。
                                            }
                                            return actions.resolve(); // 向PayPal表示您不需要对买家的购物车进行任何更改。
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Basket;
