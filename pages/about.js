import React from "react";
import Header from "../components/header";
import Head from "next/head";

function OurStore() {

    const seoTitle = "About SculeBJC - Our Story, Mission, and Contact Information | SculeBJC";
    const seoDescription = "Explore the story and mission behind SculeBJC, along with our contact details and social media accounts.";

    return (
    <>
      <Head>
          <title>{seoTitle}</title>
          <meta name="description" content={seoDescription} />

          <meta name="twitter:card" content="summary" />
          {/* 下面4个是和twitter共用的 */}
          <meta property="og:url" content="https://www.eminstore.com/about/" />
          <meta property="og:title" content={seoTitle} />
          <meta property="og:description" content={seoDescription} />
          <meta property="og:image" content="https://www.eminstore.com/eminstore.png" />

          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="eminstore" />

          <link
              rel="stylesheet"
              href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
          />
      </Head>
      <div className="w-full min-h-screen bg-cusgray ">
        <Header />
        <div className="max-w-5xl mx-auto pt-20 pb-10 md:px-0">
          <div className="md:rounded-2xl overflow-hidden bg-white shadow-lg grid grid-cols-1 md:grid-cols-2">
            <div className="grid relative grid-cols-2 grid-rows-2 overflow-hidden bg-gray-600 gap-0">
              <div className="absolute top-0 w-full h-full bg-gray-500 bg-opacity-30"></div>
              <div className="col-span-1 h-60">
                <img
                  className="object-cover w-full h-full"
                  src="\about_bg_1.jpg"
                  alt=""
                />
              </div>
              <div className="col-span-1 h-60">
                <img
                  className="object-cover w-full h-full"
                  src="\about_bg_2.jpg"
                  alt=""
                />
              </div>
              <div className="col-span-2 h-60">
                <img
                  className="object-cover w-full h-full"
                  src="\about_bg_3.jpg"
                  alt=""
                />
              </div>
            </div>
            <div className="px-10 py-10 text-cusblack row-start-1 md:col-start-2">
              <h1 className="text-xl mb-5 bg-cusblack text-white py-1 px-3 rounded-sm">
                  About
              </h1>
              <div className="my-2">
                <h3 className="mb-1 text-lg font font-semibold">
                    Eminent Goods
                </h3>
                <p className="text-sm">
                SculeBJC is a comprehensive e-commerce website dedicated to selling high-quality products at affordable prices. Our mission is to provide eminent goods.
                </p>
              </div>
                {/* TODO: Contact Information */}
                <div className="my-2 mt-4">
                    <h3 className="mb-1 text-lg font font-semibold">Contact Us</h3>
                    <p className="text-sm">
                        If you have any questions or need further information, please don't hesitate to get in touch with us. We're here to assist you.
                    </p>
                    <ul className="list-none pl-0 mt-1">
                        <li className="text-sm">
                            <strong>Email:</strong> <a href="mailto:service@eminstore.com">service@eminstore.com</a>
                        </li>
                        <li className="text-sm">
                            <strong>Phone:</strong> 214-306-3482
                        </li>
                        <li className="text-sm">
                            <strong>Address:</strong> 4132 Rawlins Street apt 205 Dallas Texas 75219
                        </li>
                    </ul>
                </div>
                {/* TODO: End Contact Information */}
                {/* Social Media Links */}
                <div className="mt-4">
                    <h3 className="mb-1 text-lg font font-semibold">Follow Us</h3>
                    <ul className="list-none pl-0 flex space-x-2">

                        {/* Twitter */}
                        <li>
                            <a href="https://twitter.com/Hi_EminX" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-twitter text-2xl transition duration-300 hover:text-blue-500"></i> {/* 使用适当的社交媒体图标类 */}
                            </a>
                        </li>
                        {/* TikTok */}
                        <li>
                            <a href="https://www.tiktok.com/@hi_eminx" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-tiktok text-2xl transition duration-300 hover:text-red-500"></i> {/* 使用适当的社交媒体图标类 */}
                            </a>
                        </li>
                        {/* Facebook */}
                        {/*<li>*/}
                            {/*<a href="https://www.facebook.com/YourFacebookPage" target="_blank" rel="noopener noreferrer">*/}
                                {/*<i className="fab fa-facebook text-2xl transition duration-300 hover:text-blue-500"></i> /!* 使用适当的社交媒体图标类 *!/*/}
                            {/*</a>*/}
                        {/*</li>*/}
                        {/* Instagram */}
                        <li>
                            <a href="https://www.instagram.com/hi_eminx" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-instagram text-2xl transition duration-300 hover:text-red-500"></i> {/* 使用适当的社交媒体图标类 */}
                            </a>
                        </li>
                        {/* 添加更多社交媒体图标和链接 */}
                    </ul>
                </div>
              {/* TODO: End Contact Information */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default OurStore;
