/*! For license information please see main.js.LICENSE.txt */
//# sourceMappingURL=main.js.map

/* Custom js to convert server calls to client calls - start */

(function() {
    // Function to dynamically load a script
    function loadScript(src, onload) {
        var script = document.createElement('script');
        script.src = src;
        script.async = false;  // Ensures scripts are loaded in order
        script.onload = onload;  // Callback after script is loaded
        document.head.appendChild(script);
    }

    // Load jQuery first
    loadScript('https://code.jquery.com/jquery-3.7.1.min.js', function() {
        console.log('jQuery has been loaded.');
        
        // Load Cart.js after jQuery is loaded
        loadScript('https://unpkg.com/cart-localstorage@1.1.4/dist/cart-localstorage.min.js', function() {
            console.log('Cart.js has been loaded.');

            // Initialize Cart.js after both scripts are loaded
            $(document).ready(function() {
                init(); 
                console.log('custom overrides initialized');
            });
        });
    });

    // load Data Cloud Web SDK
    loadScript('https://cdn.c360a.salesforce.com/beacon/c360a/51c6ab59-80c1-42a8-920c-70eab5a1c28a/scripts/c360a.min.js', function() {
        console.log('Data Cloud Web SDK has been loaded.'); 
    });

    // Load slick js for Carousels 
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.js", function() {
            console.log("slick.min.js has been loaded.");
    });

})();


let currentPage = window.location.pathname;
let cfProxy = 'ntoproxy.mathes-btech.workers.dev'; // update
let productColor, productImage, productSize, productUrl ;

function init() {
    // replace all server href's to htmls. Eg., ../en_US/women to ../en_US/women.html
    $('a[href]').each(function() {
        let href = $(this).attr('href');

        // Check if href does not end with .html
        if (!href.endsWith('.html')) {
            // Append .html to the href
            $(this).attr('href', href + '.html');
        }
    });

    // report all /Product-Variation to cloudflare proxy in data-url
    $('*[data-url]').each(function(){
        var url = $(this).attr('data-url');
        if(url.includes('https://www.northerntrailoutfitters.com/on/demandware.store/Sites-NTOSFRA-Site/en_US/Product-Variation')) {
            var updatedUrl = url.replace('www.northerntrailoutfitters.com', cfProxy);
            $(this).attr('data-url', updatedUrl);
        }
    });

    // Remove all cart-MiniCartShow.html -- todo remove event listners on this cart.
    $('.minicart').removeAttr('data-action-url');
    
    // Refresh the counter at top right corner @ minicart-quantity
    $('.minicart-quantity').html(cartLS.list().length);

    // Email Footer store to local storage 
    $('#MCSubscriptionForm').removeAttr('action').removeAttr('method');
    $('#MCSubscriptionForm').submit(function(event) {
        event.preventDefault();
        console.log('submit called..');
        let emailAddress = $('#dwfrm_mcsubscribe_email').val();
        let emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (emailPattern.test(emailAddress)) {
            // store in session storage
            localStorage.setItem('emailAddress', emailAddress);
            $('.savedMessage').remove();
            if ($('#savedMessage').length === 0) {
                $('<p class="savedMessage">Email address saved</p>').insertAfter('input[name="csrf_token"]');
            }
            $('.savedMessage').fadeIn().delay(3000).fadeOut();
        } else { 
            $('.errorMessage').remove();
            if ($('#errorMessage').length === 0) {
                $('<p class="errorMessage" style="color: #d6483e">Invalid email address format</p>').insertAfter('input[name="csrf_token"]');
            }
            $('.errorMessage').fadeIn().delay(3000).fadeOut();
        }

    });

    // Signin button 
    if (currentPage.endsWith('login.html')) {
        $('.login').click(function(event) {
            event.preventDefault();
            console.log('Login called..');
    
            let email = $('#login-form-email').val();
            let pwd = $('#login-form-password').val();

            let storedEmail = localStorage.getItem('emailAddress');
            let storedPwd = localStorage.getItem('pwd');

            if(storedEmail == email && pwd == storedPwd) { 
            }

        });
    }

    // Login-Register.html
    if(currentPage.endsWith('Login-Register.html')) {
        console.log('Page Type : Registration');
        $('.registration').removeAttr('action').removeAttr('method');
        $('.registration').on('click', function(event) {
            event.preventDefault();
            console.log('Register called..');

            let emailAddress = $('#registration-form-email').val();
            let pwd = $('#registration-form-password').val();
            let pwdConfirm = $('#registration-form-password-confirm').val();
            let firstName = $('#registration-form-fname').val();
            let lastName = $('#registration-form-lname').val();
            let dob = $('#registration-form-birthday').val();
            let phone = $('#registration-form-phone').val();


            if (emailAddress.length > 0 && pwd.length > 0 && pwdConfirm.length > 0 && phone.length > 0) { 
                
                $('#form-email-error').html('').hide();
                $('#form-password-error').html('').hide();
                $('#form-password-confirm-error').html('').hide();
                $('#form-phone-error').html('').hide();

                localStorage.setItem('emailAddress', emailAddress);
                localStorage.setItem('pwd', pwd);
                localStorage.setItem('pwdConfirm', pwdConfirm);
                localStorage.setItem('firstName', firstName);
                localStorage.setItem('lastName', lastName);
                localStorage.setItem('dob', dob);
                localStorage.setItem('phone', phone);

                // todo - Show success message
                showModel('Account details are stored into local storage.');

            } else { 
                if(phone.length === 0) { 
                    $('#form-phone-error').html('This field is required.').show();
                }
                if(emailAddress.length === 0) {
                    $('#form-email-error').html('This field is required.').show();
                }
                if(pwd.length === 0) { 
                    $('#form-password-error').html('This field is required.').show();
                }
                if(pwdConfirm === 0) {
                    $('#form-password-confirm-error').html('This field is required.').show();
                }
            }

        });

        $('#registration-form-password-confirm, #registration-form-password').on('blur', function(){
            let password = $('#registration-form-password').val();
            let confirmPassword = $('#registration-form-password-confirm').val();
            if (password === confirmPassword) {
                console.log("Passwords match.");
                $('#form-password-confirm-error').html('Passwords match').hide();
            } else {
                console.log("Passwords do not match.");
                $('#form-password-confirm-error').html('Passwords do not match').show();
            }
        });
        
    }

    // Cart.html page
    if (currentPage.endsWith('cart.html')) {
        $('.edit').remove();
        $('.move').remove();

        let cartProducts = cartLS.list();
        if(cartProducts.length >= 0) { 
            initCartPage();
        } else { 
            $('.container.cart.cart-page').html('<div class="row"> <div class="col-12 text-center"> <h1>Your Shopping Cart is Empty</h1> </div> </div>');
        }


        function initCartPage() { 
            cartProducts = cartLS.list();
            if(cartProducts.length == 0) { 
                $('.container.cart.cart-page').html('<div class="row"> <div class="col-12 text-center"> <h1>Your Shopping Cart is Empty</h1> </div> </div>');
            }
            // set cart count 
            $('.number-of-items').html(Number(cartProducts.length));
            generateProductHTML();
            updateOrderSummary();
            updatePageCartCount();
            $('.edit').remove();
            $('.move').remove();
            // Remove from cart button action
            $('.remove-btn-lg').click(function(event){ 
                event.preventDefault();
                let productId = $(this).attr('data-pid');
                cartLS.remove(productId);
                cartProducts = cartLS.list();
                console.log('ReinitCartPage cart with products ' , cartProducts)
                initCartPage();
                console.log('Remove Product from cart :', productId);
            });
        }

        function generateProductHTML(){ 
            $('.product-info').empty();
            let storedCartProducts = JSON.parse(localStorage.getItem('cartProducts'));

            cartProducts.forEach(product => {
                console.log('Product html ' , product)
                let productLS = storedCartProducts.find(p => p.id === product.id)
                const uuid = generateUUID(); // Use your own UUID generator or a fixed UUID if needed
        
                const productHtml = `
                <div class="row">
                    <div class="col-12 col-md-7">
                        <div class="d-flex flex-row">
                            <div class="item-image">
                                <a href="${product.url}">
                                    <img class="product-image" src="${productLS.image}" alt="${product.name}" title="${product.name}">
                                </a>
                            </div>
                            <div class="product-details">
                                <div class="line-item-header">
                                    <div class="line-item-name">
                                        <a href="${product.url}" class="d-inline-block text-reset text-truncate">${product.name}</a>
                                    </div>
                                </div>
                                <div class="d-block d-md-none">
                                    <div class="line-item-total-price">
                                        <div class="item-total-${uuid} price">
                                            <div class="d-flex justify-content-end">
                                                <div class="strike-through non-adjusted-price">
                                                    null
                                                </div>
                                                <div class="pricing line-item-total-price-amount item-total-null">
                                                    $${(product.price * product.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="item-attributes d-flex flex-column">
                                    <div class="line-item-attributes Color-${uuid}">
                                        <span class="font-weight-bold">Color</span>:
                                        <span class="line-item-attribute-value">Vintage White</span>
                                    </div>
                                    <div class="line-item-attributes Size-${uuid}">
                                        <span class="font-weight-bold">Size</span>:
                                        <span class="line-item-attribute-value">XXL</span>
                                    </div>
                                    <div class="line-item-quanity-info quantity" data-uuid="${uuid}" data-pid="${product.id}">
                                        <span class="qty-card-quantity-label">
                                            Quantity
                                        </span>:
                                        <span class="qty-card-quantity-count">
                                            ${product.quantity}
                                        </span>
                                    </div>
                                    <div class="line-item-availability availability-${uuid}">
                                        <div class="line-item-availability-status in-stock">In Stock</div>
                                    </div>
                                    <div class="product-subscription">
                                        <og-offer product="${product.id}">
                                            <div slot="standard-template" class="og-offer">
                                                <div class="pb-1">
                                                    <og-optout-button>
                                                        <og-text key="offerOptOutLabel" slot="label"></og-text>
                                                    </og-optout-button>
                                                </div>
                                                <div class="pb-1">
                                                    <og-optin-button></og-optin-button>
                                                </div>
                                                <div>
                                                    <og-text class="frequency-text" key="offerEveryLabel"></og-text>
                                                    <og-select-frequency></og-select-frequency>
                                                </div>
                                            </div>
                                            <div slot="upsell-template" class="og-iu-offer">
                                                <og-upsell-button></og-upsell-button>
                                                <og-upsell-modal></og-upsell-modal>
                                            </div>
                                        </og-offer>
                                    </div>
                                    <div class="gift-registry-item-tag d-none">
                                        <p class="line-item-attributes"></p>
                                    </div>
                                </div>
                                <div class="line-item-promo item-${uuid} d-block d-md-none"></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-md-5 d-flex flex-column justify-content-between align-items-end product-card-footer">
                        <div class="d-none d-md-block">
                            <div class="line-item-total-price">
                                <div class="item-total-${uuid} price">
                                    <div class="d-flex justify-content-end">
                                        <div class="strike-through non-adjusted-price">
                                            null
                                        </div>
                                        <div class="pricing line-item-total-price-amount item-total-null">
                                            $${(product.price * product.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="line-item-promo item-${uuid}"></div>
                        </div>
                        <div class="product-edit product-move">
                            <a href="https://d1xwwsagkcyxci.cloudfront.net/store/Sites-NTOSFRA-Site/en_US/Cart-GetProduct?uuid=${uuid}" class="edit" data-toggle="modal" data-target="#editProductModal" aria-label="Edit product ${product.name}" title="Edit">Edit</a>
                            <a href="../en_US/addtowishlist" class="move" data-pid="${product.id}" data-name="${product.name}" data-action="/on/demandware.store/Sites-NTOSFRA-Site/en_US/Cart-RemoveProductLineItem" data-uuid="${uuid}" title="Move to Wishlist">Move to Wishlist</a>
                            <a href="../en_US/cart.html" class="remove-btn-lg remove-product" data-pid="${product.id}" data-action="/on/demandware.store/Sites-NTOSFRA-Site/en_US/Cart-RemoveProductLineItem" data-uuid="${uuid}" aria-label="Remove product ${product.name}" title="Remove">
                                Remove
                            </a>
                        </div>
                    </div>
                </div>`;
        
                // Append the generated HTML to a container in your document
                $('.product-info').append(productHtml);
            });
        }

        function updateOrderSummary() { 
            let cartTotal = cartLS.total();
            if (cartTotal >= 50) { 
                $('.promotion-standard-shipping').show();
                $('.shipping-discount-total').html('-$5.99');
            } else { 
                $('.promotion-standard-shipping').hide();
                $('.shipping-discount-total').html('NA');
            }

            // Update Sales Tax - 5% 
            $('.tax-total').html('$' + (cartTotal * 0.05).toFixed(2));
            // Update Estimated Total - cartTotal + 5% Salestax + shipping cost
            let grandTotal = (cartTotal * 1.05 + (cartTotal >= 50 ? 0 : 5.99)).toFixed(2);
            $('.grand-total').html('$' + grandTotal)
        }

        function updatePageCartCount() { 
            $('.minicart-quantity').html(cartLS.list().length);
        }
    } // cart html page ends

    // Cart.html page
    if (currentPage.endsWith('checkout.html')) {
        // Continue As Guest
        console.log('Checkout page');
        $('.logo').attr('src','https://'+cfProxy+'/on/demandware.static/Sites-NTOSFRA-Site/-/default/dw37b11b7f/images/logo.svg');
        $('.logo-alt').attr('src','https://'+cfProxy+'/on/demandware.static/Sites-NTOSFRA-Site/-/default/dw37b11b7f/images/logo.svg');
        
        $('.card.ghost.customer').hide();
        $('.card.customer-summary').hide();
        $('.card.ghost.shipping').hide();
        $('.card.shipping-section').hide();
        $('.card.shipping-summary').hide();
        $('.multi-shipping').hide();
        $('.card.ghost.payment').hide();
        $('.card.payment-form').hide();
        $('.card.payment-summary').hide();
        $('.btn.submit-shipping').hide();
        $('.btn.submit-payment').hide();
        $('.btn.place-order').hide();
        $('.multi-ship-action-buttons').hide();
        $('#request-passwordless-login-modal').parent().hide();
        
        $('.js-login-customer').parent().remove();
        $('#guest-customer').removeAttr('action').removeAttr('method');
        $('#guest-customer').submit(function(event) {
            event.preventDefault();
            console.log('submit called..');
            let emailAddress = $('#email-guest').val();
            if(emailAddress.length > 0) { 
                $('.card.shipping-section').show();
                $('.single-shipping').parent().show();
                $('.place-order').removeAttr('data-action').show();
                $('.place-order').click(function(){ 
                    console.log('Place Order');
                    showModel('Northern Trail Outfitters is not a real company. It is used for Salesforce demos. No orders will be processed.');
                });
            }
        });
        
    } // cart html page ends

    // if size / color not found, then enable add to cart
    if($('.size-attribute').length === 0 && $('.color-attribute').length === 0) { 
        console.log('Size or color not found');
        $('.add-to-cart').removeAttr('disabled');
    }

    // Size Functions 
    // When Size button is clicked, select it
    $('.size-attribute').click(function(){ 
        $('.size-attribute').removeClass('selected');
        $(this).addClass('selected');
        enableAddToCart();
    });


    // Color Functions 
    // When Color button is clicked, select it
    $('.color-attribute').on('click', function() {
        $('.color-value').removeClass('selected');
        $(this).find('.color-value').addClass('selected');
        
        const url = $(this).attr('data-url');
        console.log(url);
        // DEV - start
        fetch(url)
        .then(response => response.json())
        .then(data => {
            //console.log('[cart data]: ' ,  JSON.stringify(data, null, 2) );
            data.product.variationAttributes.forEach(function(item) { 
                if(item['attributeId'] == 'color') { 
                    console.log('Select product color ' , item.displayValue);
                    productColor = item.displayValue;
                }
            });
        })
        .catch(error => console.error('Error fetching data:', error));
        enableAddToCart();
    });
        

}

function showModel(message) { 
    // Create and append the modal structure
    $('body').append(`
        <button id="showModal" hidden>Show Modal</button>
        <div id="myModal" class="modal">
            <div class="modal-content">
                <p id="modalMessage">${message}</p>
                <button class="ok-button">OK</button>
            </div>
        </div>
    `);

    // Set CSS for modal container
    $('.modal').css({
        'display': 'none',
        'position': 'fixed',
        'z-index': '1',
        'left': '0',
        'top': '0',
        'width': '100%',
        'height': '100%',
        'overflow': 'auto',
        'background-color': 'rgba(0, 0, 0, 0.4)'
    });

    // Set CSS for modal content
    $('.modal-content').css({
        'background-color': '#fefefe',
        'margin': '15% auto',
        'padding': '20px',
        'border': '1px solid #888',
        'width': '80%',
        'max-width': '400px'
    });

    // Set CSS for OK button
    $('.ok-button').css({
        'background-color': '#097fb3',
        'color': 'white',
        'padding': '10px 20px',
        'margin-top': '15px',
        'border': 'none',
        'cursor': 'pointer',
        'width': '100%',
        'text-align': 'center'
    });

    // Add hover effect for OK button
    $('.ok-button').hover(
        function() {
            $(this).css('background-color', '#45a049');
        }, 
        function() {
            $(this).css('background-color', '#097fb3');
        }
    );

    // Show the modal when the button is clicked
    $('#showModal').on('click', function() {
        $('#myModal').fadeIn();
    });

    // Hide the modal when the OK button is clicked
    $('.ok-button').on('click', function() {
        $('#myModal').fadeOut();
    });

    $('#myModal').fadeIn();
} // function showModel ends 


// enable add-to-cart button when size + quantity are chosen
let enableAddToCart = () => { 
    if ($('.size-attribute.selected').length > 0 && $('.color-value.selected').length > 0) {
        $('.add-to-cart').removeAttr('disabled');
    }
}


// Remove all listneres and Override .add-to-cart button 

$('.add-to-cart').off('click').on('click', function(event) {
    event.preventDefault();
    
    console.log('Add to Cart button clicked!');

    // This is replaced and productColor is set ON button click
    // $('.color-attribute').each(function() {
    //     const selectedSpan = $(this).find('span.selected');
    //     if (selectedSpan.length > 0) {
    //         productColor = selectedSpan.data('attr-value');
    //         console.log('Color selected - ', productColor);
    //     }
    // });

    productUrl = window.location.href || '';
    productSize = $('button.selected').text().replaceAll('\n','').trim();

    productImage = $('.slick-active').find('img').attr('src');
    // $('.product-carousel .carousel-item').first().find('img').attr('src'); // picks wrong value 
    let product = {
        id: $('.product-id').text(),
        name: $('.product-name').first().text(),
        price: parseFloat($('.prices .value').attr('content')),
        color: productColor,
        image: productImage,
        size: productSize,
        url: productUrl
    };

    // store it in local storage 
    let products = localStorage.getItem('cartProducts');
    products = JSON.parse(products);
    if(!Array.isArray(products)) {
        products = [];
    }
    if(!products.find(p => p.id === product.id)){
        products[products.length] = product; 
    }
    localStorage.setItem('cartProducts', JSON.stringify(products));
    console.log('cart Products in local storage ' , localStorage.getItem('cartProducts'));

    let quantity = Number($('#quantity-1').find('option:selected').val());
    console.log('Adding product to cart ' , product, quantity)
    cartLS.add(product, quantity);

    console.log(cartLS.total()) 

    // Refresh the counter at top right corner @ minicart-quantity
    $('.minicart-quantity').html(cartLS.list().length);
    
    // Remove Loader
    checkAndRemoveLoader();
});


function checkAndRemoveLoader() {
    const intervalId = setInterval(function() {
        if ($('.veil').length === 0) {
            clearInterval(intervalId);
        } else { 
            $('html').removeClass("veiled");
            $('.veil').remove();
            $.get('https://d1xwwsagkcyxci.cloudfront.net/store/Sites-NTOSFRA-Site/en_US/Cart-MiniCartShow.html', function(data) {
                $('.minicart-container').html(data);
                $('.minicart-container').addClass('open');
            });
        }
    }, 1000);
}

setInterval(checkAndRemoveLoader, 1000);


// Aug 21st - Moving from pages to main.js

// Remove Cart URL redirection 
$('.add-to-cart-url').remove();

// Change Mini Cart URL
$('[data-action-url$="Cart-MiniCartShow"]').each(function() {
    let newUrl = '.' + $(this).attr('data-action-url') + '.html';
    $(this).attr('data-action-url', newUrl);
});

// When minicart-container clicked, show the content from ./on/demandware.store/Sites-NTOSFRA-Site/en_US/Cart-MiniCartShow.html
$('.minicart').on('click', function(){
    let miniCartHtml = `<div class="minicart-header d-flex justify-content-between align-items-center"><span class="minicart-title pl-3 py-2"><i class="far fa-lg fa-shopping-bag pr-1" aria-hidden="true"></i>Your Cart (<span class="minicart-quantity">0</span>)</span><button class="btn-close px-3 py-2"><i class="far fa-times"></i></button></div><div class="minicart-error cart-error"></div><div class="product-summary"></div><div class="minicart-footer px-3 pb-3"><div class="estimated-total d-flex justify-content-between my-3"><div class="sub-total-label">Estimated Total</div><div class="text-right sub-total"></div></div><a class="btn btn-outline-primary btn-block mb-1" href="../en_US/cart.html" title="View Cart">View Cart</a><div class="mb-sm-3"><a href="../en_US/checkout.html" class="btn btn-primary btn-block checkout-btn" role="button">Checkout</a></div></div>`;
    console.log('miniCartHtml ' , miniCartHtml);
    $('.minicart-container').html(miniCartHtml);
    initMiniCart();
});

function initMiniCart() {
    cartProducts = cartLS.list();
    init();
    function init() { 
        let cartProducts = cartLS.list();
        console.log('[MiniCart]: cart products ' , cartProducts)
        $('.minicart-quantity').html(cartProducts.length);
        setProductSummaryHTML();
        $('.sub-total').html(' $' + cartLS.total().toFixed(2));
    }

    // set event listener for remove button 
    $('.remove-line-item, .remove-btn').on('click', function() {
        // Get the product ID from the data-pid attribute
        console.log('Remove button clicked ' , $(this));
        console.log('Remove button clicked ' , $(this).find('.remove-btn'));
        let productId = $(this).find('.remove-btn').data('pid') || $(this).data('pid');
        productId = String(productId);
        cartLS.remove(productId);
        cartProducts = cartLS.list();
        init();

        console.log('Remove Product from cart :', productId);

        // Keep the cart open 
        $('.minicart-container').addClass('open')

    });


    function setProductSummaryHTML(){
        $('.product-summary').empty();
        let storedCartProducts = JSON.parse(localStorage.getItem('cartProducts'));
            
        cartProducts.forEach(product => {
            console.log('[MinCart]: Product html for ' ,product );
            let productLS = storedCartProducts.find(p => p.id === product.id)
            console.log('Product from LS ' , productLS);

            let uuid = generateUUID(); 
            let colorHtml = '', sizeHtml = '';
            if(product.color) { 
                colorHtml = `<div class="line-item-attributes"><span class="attribute-label">Color: </span><span class="attribute-value">${product.color}</span></div>`
            }
            if(product.size) { 
                sizeHtml = `<div class="line-item-attributes"><span class="attribute-label">Size: </span><span class="attribute-value">${product.size}</span></div>`
            }
            let productHtml = `
            <div class="uuid-${uuid} product-line-item-container">
                <div class="product-line-item" data-product-line-item="${uuid}">
                    <div class="d-flex flex-row">
                        <div class="item-image">
                            <a href="${product.url}">
                                <img class="product-image" src="${product?.image}"
                                    alt="${product.name}" title="${product.name}" />
                            </a>
                        </div>
                        <div class="product-line-item-details flex-grow-1">
                            <div class="line-item-header">
                                <div class="line-item-name">
                                    <a href="${product.url}" class="text-reset">
                                        ${product.name}
                                    </a>
                                </div>
                                <div class="remove-line-item">
                                    <button type="button" class="remove-btn remove-product btn btn-light" data-pid="${product.id}"
                                        data-action="/on/demandware.store/Sites-NTOSFRA-Site/en_US/Cart-RemoveProductLineItem" data-uuid="${uuid}"
                                        aria-label="Remove product ${product.name}">
                                        <span aria-hidden="true">
                                            &times;
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <div class="item-attributes">
                                ${colorHtml}
                                ${sizeHtml}
                                <div class="item-options">
                                </div>
                                <div class="line-item-quanity-info quantity" data-uuid="${uuid}" data-pid="${product.id}">
                                    <span class="qty-card-quantity-label">
                                        Quantity
                                    </span>:
                                    <span class="qty-card-quantity-count">
                                        ${product.quantity}
                                    </span>
                                </div>
                                <div class="line-item-total-price justify-content-end">
                                    <div class="item-total-${uuid} price">
                                        <div class="d-flex justify-content-end">
                                            <div class="strike-through non-adjusted-price">
                                                null
                                            </div>
                                            <div class="pricing line-item-total-price-amount item-total-${uuid}">
                                                $${(product.price * product.quantity).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="line-item-promo item-${uuid} text-center">
                    </div>
                </div>
            </div>`;

            $('.product-summary').append(productHtml);
        });   
    }
} // fn initMiniCart ends



function generateUUID() { 
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
/* Custom js to convert server calls to client calls - end */