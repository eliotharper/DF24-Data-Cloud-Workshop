document.addEventListener(SalesforceInteractions.DataCloud.CustomEvents.OnEventSend, (event) => {
  SalesforceInteractions.log.debug('[DC SendEvent]: ', JSON.stringify(event.detail, null, 2))
})

SalesforceInteractions.init({
  //In a 'real world' implementation, you will need to define the cookieDomain.
  //For this example, we will leave it commented out.
  /*cookieDomain: 'mysite.com',*/
  consents: [{
    status: SalesforceInteractions.ConsentStatus.OptIn,
    purpose: SalesforceInteractions.ConsentPurpose.Tracking,
    provider: 'Test Provider'
  }]
}).then(() => {
  console.log('Salesforce Interactions Web SDK is ready');
  // set the log level during sitemap development to see potential problems
  SalesforceInteractions.setLoggingLevel('DEBUG');
  const sitemapConfig = {
    global: {
      listeners: [
        // capture when the user signs up for newsletter
        SalesforceInteractions.listener('click', '#newsletter_submit', () => {
          console.log('submitted newsletter form');
          SalesforceInteractions.sendEvent({
            interaction: {
              name: 'newsletterSignup',
              eventType: 'ntoSite',
              attributes: {
                INSERT: SalesforceInteractions.cashDom('#dwfrm_mcsubscribe_email').val()
              }
            }
          });
        })
      ],
    },
    pageTypeDefault: {
      name: 'default',
      interaction: {
        name: 'Default Page',
      },
    },
    pageTypes: [{
        name: 'product_detail',
        /*
                The best practice for isMatch is to match as quickly as possible. If matching immediately is not an option, you can use a Promise.
                The Promise should resolve true or false and not pend indefinitely. This Promise example uses a setTimeout to prevent the isMatch from pending indefinitely if the match condition is not met fast enough. In this scenario, we know that the match condition will be met within 50 milliseconds or not at all. Note that using a timeout like this might not be sufficient in all cases and if you are using a Promise it should be tailored to your specific use-case.
                */
        isMatch: () =>
          new Promise((resolve, reject) => {
            let isMatchPDP = setTimeout(() => {
              resolve(false);
            }, 50);
            return SalesforceInteractions.DisplayUtils.pageElementLoaded(
              'div.page[data-action=\'Product-Show\']',
              'html',
            ).then(() => {
              clearTimeout(isMatchPDP);
              resolve(true);
            });
          }),
        interaction: {
          name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
          catalogObject: {
            type: 'Product',
            id: () => {
              return SalesforceInteractions.util.resolveWhenTrue.bind(() => {
                const productId = SalesforceInteractions.cashDom('.product-id').first().text();
                const products = getProductsFromDataLayer();
                if (products && products.length > 0) {
                  return products[0].id;
                } else if (productId) {
                  return productId;
                } else {
                  return false;
                }
              });
            },
            attributes: {
              sku: {
                id: SalesforceInteractions.cashDom('.product-detail[data-pid]').attr('data-pid'),
              },
              name: SalesforceInteractions.resolvers.fromJsonLd('name'),
              description: SalesforceInteractions.resolvers.fromSelector(
                '.short-description',
                (desc) => desc.trim(),
              ),
              url: SalesforceInteractions.resolvers.fromHref(),
              imageUrl: SalesforceInteractions.resolvers.fromSelectorAttribute(
                '.product-carousel .carousel-item[data-slick-index=\'0\'] img',
                'src',
                (url) => window.location.origin + url,
              ),
              inventoryCount: 1,
              price: SalesforceInteractions.resolvers.fromSelector(
                '.prices .price .value',
                (price) => parseFloat(price.replace(/[^0-9\.]+/g, '')),
              ),
              // rating: () => {
              //   return SalesforceInteractions.mcis.extractFirstGroup(
              //     /([.\w]+) out of/,
              //     SalesforceInteractions.cashDom('.ratings .sr-only').text(),
              //   );
              // },
            },
            relatedCatalogObjects: {
              Category: SalesforceInteractions.DisplayUtils.pageElementLoaded(
                '.container .product-breadcrumb .breadcrumb a',
                'html',
              ).then((ele) => {
                return SalesforceInteractions.resolvers.buildCategoryId(
                  '.container .product-breadcrumb .breadcrumb a',
                  null,
                  null,
                  (categoryId) => [categoryId.toUpperCase()],
                );
              }),
              Gender: SalesforceInteractions.DisplayUtils.pageElementLoaded(
                '.product-breadcrumb .breadcrumb a, h1.product-name',
                'html',
              ).then((ele) => {
                if (
                  SalesforceInteractions.cashDom('.product-breadcrumb .breadcrumb a')
                  .first()
                  .text()
                  .toLowerCase() === 'women' ||
                  SalesforceInteractions.cashDom('h1.product-name').text().indexOf('Women') >= 0
                ) {
                  return ['WOMEN'];
                } else if (
                  SalesforceInteractions.cashDom('.product-breadcrumb .breadcrumb a')
                  .first()
                  .text()
                  .toLowerCase() === 'men' ||
                  SalesforceInteractions.cashDom('h1.product-name').text().indexOf('Men') >= 0
                ) {
                  return ['MEN'];
                } else {
                  return;
                }
              }),
              Color: SalesforceInteractions.DisplayUtils.pageElementLoaded(
                '.attributes',
                'html',
              ).then((ele) => {
                return SalesforceInteractions.resolvers.fromSelectorAttributeMultiple(
                  '.color-value',
                  'data-attr-value',
                );
              }),
              Feature: SalesforceInteractions.DisplayUtils.pageElementLoaded(
                '.features',
                'html',
              ).then((ele) => {
                return SalesforceInteractions.resolvers.fromSelectorMultiple(
                  '.long-description li',
                  (features) => {
                    return features.map((feature) => {
                      return feature.trim().toUpperCase();
                    });
                  },
                );
              }),
            },
          },
        },
        listeners: [
          SalesforceInteractions.listener('click', '.add-to-cart', () => {
            let lineItem = {
              catalogObjectType: 'Product',
              catalogObjectId: $('.product-id').text(),
              price: parseFloat($('.prices .value').attr('content')),
              quantity: Number($('#quantity-1').find('option:selected').val())
            };
            SalesforceInteractions.sendEvent({
              interaction: {
                name: SalesforceInteractions.CartInteractionName.AddToCart,
                eventType: 'cartItem',
                lineItem: lineItem,
              },
            });
          }),
          SalesforceInteractions.listener('click', '.attribute', (event) => {
            let classList = event.target.classList.value.split(' ');
            if (classList.includes('color-value') || classList.includes('size-value')) {
              SalesforceInteractions.sendEvent({
                interaction: {
                  name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObjectDetail,
                  catalogObject: {
                    type: 'Product',
                    id: SalesforceInteractions.getSitemapResult().currentPage.interaction
                      .catalogObject.id,
                    attributes: {
                      sku: {
                        id: SalesforceInteractions.cashDom('.product-detail[data-pid]').attr(
                          'data-pid',
                        ),
                      },
                    },
                    relatedCatalogObjects: {
                      Color: [
                        SalesforceInteractions.cashDom('.color-value.selected').attr(
                          'data-attr-value',
                        ),
                      ],
                    },
                  },
                },
              });
            }
          }),
        ],
      },
      {
        name: 'Category',
        isMatch: () =>
          new Promise((resolve, reject) => {
            let isMatchCat = setTimeout(() => {
              resolve(false);
            }, 50);
            return SalesforceInteractions.DisplayUtils.pageElementLoaded(
              '#product-search-results',
              'html',
            ).then(() => {
              clearTimeout(isMatchCat);
              resolve(SalesforceInteractions.cashDom('.breadcrumb').length > 0);
            });
          }),
        interaction: {
          name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
          catalogObject: {
            type: 'Category',
            id: SalesforceInteractions.DisplayUtils.pageElementLoaded(
              '.breadcrumb .breadcrumb-item a',
              'html',
            ).then((ele) => {
              return SalesforceInteractions.resolvers.buildCategoryId(
                '.breadcrumb .breadcrumb-item a',
                1,
                null,
                (categoryId) => categoryId.toUpperCase(),
              );
            }),
          },
        },
        listeners: [
          SalesforceInteractions.listener('click', '.quickview', (e) => {
            const pid = SalesforceInteractions.cashDom(e.target).attr('href').split('pid=')[1];
            if (!pid) {
              return;
            }

            SalesforceInteractions.sendEvent({
              interaction: {
                name: SalesforceInteractions.CatalogObjectInteractionName.QuickViewCatalogObject,
                catalogObject: {
                  type: 'Product',
                  id: pid,
                },
              },
            });
          }),
          SalesforceInteractions.listener('click', 'body', (e) => {
            if (
              SalesforceInteractions.cashDom(e.target).closest('button[data-dismiss=\'modal\']')
              .length > 0
            ) {
              SalesforceInteractions.sendEvent({
                interaction: {
                  name: SalesforceInteractions.mcis.CatalogObjectInteractionName
                    .StopQuickViewCatalogObject,
                },
              });
            } else if (
              SalesforceInteractions.cashDom(e.target).closest('#quickViewModal').length > 0 &&
              SalesforceInteractions.cashDom(e.target).find('#quickViewModal .modal-dialog')
              .length > 0
            ) {
              SalesforceInteractions.sendEvent({
                interaction: {
                  name: SalesforceInteractions.mcis.CatalogObjectInteractionName
                    .StopQuickViewCatalogObject,
                },
              });
            }
          }),
        ],
      },
      {
        name: 'department',
        isMatch: () =>
          new Promise((resolve, reject) => {
            let isMatchDept = setTimeout(() => {
              resolve(false);
            }, 50);
            return SalesforceInteractions.DisplayUtils.pageElementLoaded(
              'div.category-tile',
              'html',
            ).then(() => {
              clearTimeout(isMatchDept);
              resolve(!/\/homepage/.test(window.location.href));
            });
          }),
      },
      {
        name: 'search_results',
        isMatch: () => /\/default\/search$/.test(window.location.pathname),
      },
      {
        name: 'cart',
        isMatch: () => /\/cart/.test(window.location.href),
        interaction: {
          name: SalesforceInteractions.CartInteractionName.ReplaceCart,
          lineItems: SalesforceInteractions.DisplayUtils.pageElementLoaded(
            '.cart-empty, .checkout-btn',
            'html',
          ).then(() => {
            let cartLineItems = [];
            SalesforceInteractions.cashDom('.product-info .product-details').each((index, ele) => {
              let itemQuantity = parseInt(
                SalesforceInteractions.cashDom(ele).find('.qty-card-quantity-count').text().trim(),
              );
              if (itemQuantity && itemQuantity > 0) {
                let lineItem = {
                  catalogObjectType: 'Product',
                  catalogObjectId: SalesforceInteractions.cashDom(ele)
                    .find('.line-item-quantity-info')
                    .attr('data-pid')
                    .trim(),
                  price: SalesforceInteractions.cashDom(ele)
                    .find('.pricing')
                    .text()
                    .trim()
                    .replace(/[^0-9\.]+/g, '') / itemQuantity,
                  quantity: itemQuantity,
                };
                cartLineItems.push(lineItem);
              }
            });
            return cartLineItems;
          }),
        },
      },
      {
        name: 'order_confirmation',
        isMatch: () => /\/confirmation/.test(window.location.href),
        interaction: {
          name: SalesforceInteractions.OrderInteractionName.Purchase,
          order: {
            id: SalesforceInteractions.DisplayUtils.pageElementLoaded('.order-number', 'html').then(
              (ele) => {
                return SalesforceInteractions.resolvers.fromSelector('.order-number');
              },
            ),
            lineItems: SalesforceInteractions.DisplayUtils.pageElementLoaded(
              '.product-line-item',
              'html',
            ).then(() => {
              let purchaseLineItems = [];
              SalesforceInteractions.cashDom('.product-line-item').each((index, ele) => {
                let itemQuantity = parseInt(
                  SalesforceInteractions.cashDom(ele)
                  .find('.qty-card-quantity-count')
                  .text()
                  .trim(),
                );
                if (itemQuantity && itemQuantity > 0) {
                  let lineItem = {
                    catalogObjectType: 'Product',
                    catalogObjectId: SalesforceInteractions.cashDom(ele)
                      .find('.line-item-quantity-info')
                      .attr('data-pid')
                      .trim(),
                    price: SalesforceInteractions.cashDom(ele)
                      .find('.pricing')
                      .text()
                      .trim()
                      .replace(/[^0-9\.]+/g, '') / itemQuantity,
                    quantity: itemQuantity,
                  };
                  purchaseLineItems.push(lineItem);
                }
              });
              return purchaseLineItems;
            }),
          },
        },
      },
      {
        name: 'home',
        isMatch: () => /\/homepage/.test(window.location.href),
        interaction: {
          name: 'Homepage',
        },
        contentZones: [{
            name: 'home_hero',
            selector: '.experience-carousel-bannerCarousel'
          },
          {
            name: 'home_sub_hero',
            selector: '.experience-carousel-bannerCarousel + .experience-component',
          },
          {
            name: 'home_popup'
          },
        ],
      },
    ],
  };
  const getProductsFromDataLayer = () => {
    if (window.dataLayer) {
      for (let i = 0; i < window.dataLayer.length; i++) {
        if (
          ((window.dataLayer[i].ecommerce && window.dataLayer[i].ecommerce.detail) || {}).products
        ) {
          return window.dataLayer[i].ecommerce.detail.products;
        }
      }
    }
  };
  SalesforceInteractions.initSitemap(sitemapConfig);
});