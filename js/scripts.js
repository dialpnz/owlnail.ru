var hash, cart = [], callbackShowed = false;

if (location.hash) {
  hash = location.hash;
  location.hash = '';
}

function getCart() {
  return localStorage.getItem('cart') === null ? {} : JSON.parse(localStorage.getItem('cart'));
}

function addProduct(id, count) {
  var cart = getCart();

  if (typeof count === 'undefined') {
    cart[id] = +(typeof cart[id] !== 'undefined' ? cart[id] : 0) + 1;
  } else {
    cart[id] = count;
  }

  localStorage.setItem('cart', JSON.stringify(cart));

  appendProductToCart(id);
}

function removeProduct(id, isCartPage, count) {
  var cart = getCart();

  if (typeof count === 'undefined') {
    cart[id] = +(typeof cart[id] !== 'undefined' ? +cart[id] : 0) - 1;
  } else {
    cart[id] = count;
  }

  if (+cart[id] <= 0 || isCartPage) delete cart[id];

  localStorage.setItem('cart', JSON.stringify(cart));

  updateCartCounter();
}

function appendProductToCart(id) {
  var product = window.products[id];

  if (typeof product === 'undefined') return false;

  var cartItem =
    '<div class="b-basket-field__basket-item">' +
    '<div class="b-basket-field__basket-cell b-basket-field__basket-cell_image">' +
    '<a href="#"><img src="' + product.thumb + '" alt="" class="b-basket-field__basket-image"></a>' +
    '</div>' +
    '<div class="b-basket-field__basket-cell b-basket-field__basket-cell_title">' +
    '<h4 class="b-basket-field__basket-title"><a href="javascript://">' + product.title + '</a></h4>' +
    '<div class="b-basket-field__basket-price b-basket-field__basket-price_mobile">' + product.price + ' руб.' +
    '</div>' +
    '</div>' +
    '<div class="j-remove-product b-basket-field__basket-cell b-basket-field__basket-cell_remove" data-id="' + id +  '">' +
    '<button type="button" class="b-basket-field__basket-remove g-remove-btn"></button>' +
    '</div>' +
    '</div>'
  ;

  $('.b-basket-field__basket').append(cartItem);

  updateCartCounter();

  return true;
}

function updateCartCounter() {
  var cart = getCart(), count = 0;

  for (var id in cart) {
    if (cart.hasOwnProperty(id)) count += +cart[id];
  }

  if (count > 0) {
    $('.b-basket-field__btn-count').text(count).show();
  } else {
    $('.b-basket-field__btn-count').hide();
  }

  if (Object.keys(cart).length === 0) {
    $('.b-basket-field__popup-footer').hide();

    $('.on-empty-cart').show();
    $('.on-notempty-cart').hide();
  } else {
    $('.b-basket-field__popup-footer').show();

    $('.on-empty-cart').hide();
    $('.on-notempty-cart').show();
  }
}

function hideCart() {
  var cart = getCart();
  if (Object.keys(cart).length === 0) {
    $('.on-empty-cart').show();
    $('.on-notempty-cart').hide();
  } else {
    $('.on-empty-cart').hide();
    $('.on-notempty-cart').show();
  }
}

$(document).ready(function() {
  var $body = $('body');
  var cart = getCart();

  if (Object.keys(cart).length > 0) {
    for (var id in cart) {
      if (cart.hasOwnProperty(id)) {
        for (var i = 0; i < +cart[id]; i++) appendProductToCart(id);
      }
    }
  }

  updateCartCounter();
  hideCart();

  $body.on('click', '.j-remove-product', function() {
    removeProduct($(this).data('id'), $(this).data('cart_page'));
    if (!$(this).data('cart_page')) {
      $(this).closest('.b-basket-field__basket-item').remove();
    } else {
      $(this).closest('.b-basket__item').remove();
    }
  });

  if (is_desktop()) {
    $('.b-basket-field').stick_in_parent({
      parent: 'body',
      offset_top: 10
    });
  }

  if (hash && $(hash).length) {
    var offsetTop = 0;

    $('html, body').animate({scrollTop: $(hash).offset().top - offsetTop}, 500, function() {
      if (history.pushState) {
        history.pushState(null, null, hash);
      } else {
        location.hash = hash;
      }
    });
  }

  $body.on('click', '#j-order', function(e) {
    var data = { products: JSON.stringify(getCart()) };
    var self = $(this);

    setTimeout(function() {
      if (self.closest('form').find('input.error').length) return;

      $('.b-order__form input, .b-order__form textarea').each(function() {
        data[$(this).attr('name')] = $(this).val();
      });

      $.post(
        '/cart/order',
        data,
        function(response) {
          localStorage.removeItem('cart');
          location.href = '/thankyou?order_id=' + response.orderNumber;
        }
      );
    }, 0);
  });

  $body.on('click', '#j-advice-btn', function(e) {
    e.preventDefault();
    if (!$(this).parent().find('input').val() || $(this).parent().find('input').hasClass('error')) return;

    $.post(
      '/site/email',
      {
        email: $(this).parent().find('input').val()
      }
    );

    $(this).parent().remove();
    $('.b-advice').append('<h2>Спасибо за интерес!</h2>')

    location.href = '/site/download';
  });

  $body.on('click', '#j-callback-btn', function(e) {
    var self = $(this);

    setTimeout(function() {
      if (self.closest('form').find('input.error').length) return;

      $.post(
        '/site/callback',
        {
          name: self.closest('form').find('input[name=name]').val(),
          phone: self.closest('form').find('input[name=phone]').val()
        }
      );

      self.closest('form').replaceWith('<h2 style="color:#e298b0;">Ожидайте звонка нашего менеджера в самое ближайшее время</h2>');
    }, 0);
  });

  $(window).scroll(function() {
    if (window.isCartPage) return;

    if($(window).scrollTop() + $(window).height() >= $(document).height() - 200) {
      if (!window.callbackShowed) {
        setTimeout(function() {
          $('.b-phone-btn').trigger('click');
        }, 500);
        window.callbackShowed = true;
      }
    }
  });

  $(document).on('click', '.b-nav__link[href^="#"]', function(e) {
    var hash = this.hash;
    var $target = $(this.hash);
    var offsetTop = is_mobile() ? 100 : 0;

    if ($target.length) {
      e.preventDefault();

      if (!is_desktop() && $('html').hasClass('is-menu-open')) {
        $('html').removeClass('is-menu-open');
        noscroll_finish();
      }

      $('html, body').animate({scrollTop: $target.offset().top - offsetTop}, 500, function() {
        if (history.pushState) {
          history.pushState(null, null, hash);
        } else {
          location.hash = hash;
        }
      });
    }
  });

  /**
   * FancyBox 3
   * @see  http://fancyapps.com/fancybox/3/
   */
  /* Disable Drag Close */
  $.fancybox.defaults.touch = false;
  $.fancybox.defaults.autoFocus = false;

  /* Open Popup Window */
  $(document).on('click', '.js-popup-open', function(e) {
    e.preventDefault();
    var type = $(this).data('type') || 'inline';
    $.fancybox.close();
    $.fancybox.open({
      src: $(this).attr('href') || $(this).data('src'),
      type: type,
    });
  });

  /* Close Popup Window */
  $(document).on('click', '.js-popup-close', function(e) {
    e.preventDefault();
    $.fancybox.close();
  });

  // Open Inline Window
  /*
  $.fancybox.open('<div class="b-popup-window"><h2 class="b-popup-window__title">Спасибо за&nbsp;заказ!</h2> <div class="b-popup-window__text">Номер вашего заказа <span class="g-color-red">№&nbsp;3718940</span><br> Скоро мы свяжимся с вами для уточнения деталей!</div></div>', {
      touch: false
  });
  */

  /**
   * Form Styler
   * @see  http://dimox.name/jquery-form-styler/
   */
  $('.js-styler').each(function() {
    var $element = $(this);
    if ($element.is('select') && $element.find('option[value=""]'))
      $element.find('option[value=""]').addClass('is-empty');
    $element.styler();
  });

  $('form').bind('reset', function() {
    var form = $(this);
    setTimeout(function() {
      form.find('input').trigger('change');
      form.find('.js-styler').trigger('refresh');
    });
  });

  /**
   * Slick
   * @see  http://kenwheeler.github.io/slick/
   */
  $('.b-product__slider').slick({
    responsive: [
      {
        breakpoint: 767,
        settings: {
          arrows: false,
          dots: true
        }
      }
    ]
  });

  /**
   * Form Validation
   * @see  http://jqueryvalidation.org/validate/
   */
  $('.js-validation-form').each(function() {
    var $form = $(this);
    $form.validate({
      errorPlacement: function(error, element) {
        if ($(element).parents('.jq-selectbox').length) {
          error.insertAfter($(element).parents('.jq-selectbox'));
        } else if ($(element).is(':checkbox') || $(element).is(':radio')) {
          error.insertAfter($(element).closest('label'));
        } else {
          error.insertAfter(element);
        }
      },
      invalidHandler: function() {
        setTimeout(function() {
          $form.find('select.js-styler').trigger('refresh');
        }, 1);
      }
    });

    $form.on('submit', function(e) {
      if ($form.valid()) {
        e.preventDefault();
      }
    });
  });

  $(document).on('change', 'select.js-styler[required]', function(e) {
    var $this = $(this);
    setTimeout(function() {
      $this.valid();
      $this.trigger('refresh');
    });
  });

  if (!navigator.userAgent.match(/iPhone/i)) {
    $(document).on('click', 'a[href^="tel:"]', function(e) {
      $(this).attr('href', $(this).attr('href').replace(/^tel:/, 'callto:'));
    });
  }

  $(document).on('click', '.b-menu-btn', function(e) {
    e.preventDefault();
    if (!$('html').hasClass('is-menu-open')) {
      noscroll_start();
      $('html').addClass('is-menu-open');
    } else {
      $('html').removeClass('is-menu-open');
      noscroll_finish();
    }
  });

  $(document).on('click', '.b-basket-field__btn', function(e) {
    e.preventDefault();
    if (!$('html').hasClass('is-basket-open')) {
      if (!$('html').hasClass('is-noscroll')) {
        if (!is_desktop()) {
          noscroll_start();
        }
      } else {
        $('html').removeClass('is-menu-open');
      }
      $('html').addClass('is-basket-open');
    } else {
      $('html').removeClass('is-basket-open');
      if (!is_desktop()) {
        noscroll_finish();
      }
    }
  });

  $(document).on('click', '.b-basket-field__popup-bg', function(e) {
    e.preventDefault();
    $('html').removeClass('is-basket-open');
    if (!is_desktop()) {
      noscroll_finish();
    }
  });

  $('.b-main__button, .b-product__button_buy').click(function(e) {
    var img;

    if ($(this).data('id')) addProduct($(this).data('id'));

    if ($(this).hasClass('b-main__button')) {
      img = $('.b-main__product-image');
    } else {
      img = $(this).parents('.b-product__item').find('.b-product__figure-image');
    }

    var basket_btn = $('.b-basket-field__btn');
    var temp_img = img.clone();
    $('body').append(temp_img);
    temp_img.css({
      width: img.width(),
      height: img.height(),
      position: 'absolute',
      'z-index': 10001,
      left: img.offset().left,
      top: img.offset().top
    }).animate({
      left: basket_btn.offset().left,
      top: basket_btn.offset().top,
      width: basket_btn.width(),
      height: basket_btn.height()
    }, 600, function() {
      temp_img.fadeOut(function() {
        temp_img.remove();
      });
    });
  });

  $(document).on('touchstart', '.b-product__figure-inner', function(e) {
    $(this).addClass('is-hover');
  });

  $(document).on('touchend', '.b-product__figure-inner', function(e) {
    $(this).removeClass('is-hover');
  });
});

$(window).scroll(function() {
  if ($(document).scrollTop() + $(window).height() < $('.b-footer__bottom').offset().top) {
    $('.b-main__dawn-arrow').removeClass('is-hidden');
  } else {
    $('.b-main__dawn-arrow').addClass('is-hidden');
  }
});

$(window).on('load', function() {
  if (!is_mobile() && !$('.b-footer__content_static').length) {
    footer_sticky();
  }
});

/**
 * Русификатор Form Validation
 */
jQuery.extend(jQuery.validator.messages, {
  required: "Обязательное поле",
  remote: "Исправьте это поле",
  email: "Некорректный e-mail",
  url: "Некорректный url",
  date: "Некорректная дата",
  dateISO: "Некорректная дата (ISO)",
  number: "Некорректное число",
  digits: "Cимволы 0-9",
  creditcard: "Некорректный номер карты",
  equalTo: "Не совпадает с предыдущим значением",
  accept: "Недопустимое расширение",
  maxlength: jQuery.validator.format("Максимум {0} символов"),
  minlength: jQuery.validator.format("Минимум {0} символов"),
  rangelength: jQuery.validator.format("Минимум {0} и максимумт {1} символов"),
  range: jQuery.validator.format("Допустимо знаечение между {0} и {1}"),
  max: jQuery.validator.format("Допустимо значение меньше или равное {0}"),
  min: jQuery.validator.format("Допустимо значение больше или равное {0}")
});

var noscroll_y = 0;

function noscroll_start() {
  noscroll_y = $(document).scrollTop();
  $('body').css('top', -noscroll_y + 'px');
  $('html').addClass('is-noscroll');
}

function noscroll_finish() {
  $('html').removeClass('is-noscroll');
  $(document).scrollTop(noscroll_y);
  $('body').css('top', 'auto');
}

function is_desktop() {
  return $('.js-lg-test').is(':visible');
}

function is_tablet() {
  return $('.js-md-test').is(':visible');
}

function is_tablet_sm() {
  return $('.js-sm-test').is(':visible');
}

function is_mobile() {
  return $('.js-xs-test').is(':visible');
}

function footer_sticky() {
  var $footer = $('.b-footer'),
    $footer_inner = $('.b-footer__inner'),
    $footer_content = $('.b-footer__content-inner'),
    $item = $('.b-footer__content-item'),
    $item_wrapper = $('.b-footer__content-item-wrapper'),
    $first_item = $('.b-footer__content-item_1'),
    $second_item = $('.b-footer__content-item_2'),
    stickyInterval, H = 0, footer_top, footer_inner_height;

  sticky_construct();

  $(window).resize(function() {
    sticky_construct();
  });

  var offset_top = -parseInt($('.b-footer__content').css('padding-top'));

  $footer_inner.stick_in_parent({
    parent: 'body',
    inner_scrolling: false,
    offset_top: offset_top,
  })
    .on("sticky_kit:stick", function(e) {
      start_sticky();
    }).on("sticky_kit:bottom", function(e) {
    clearInterval(stickyInterval);
    $first_item.height(0);
    $second_item.height(H);
  }).on("sticky_kit:unbottom", function(e) {
    start_sticky();
  }).on("sticky_kit:unstick", function(e) {
    clearInterval(stickyInterval);
    $first_item.height(H);
    $second_item.height(0);
  })
  ;

  function sticky_construct() {
    footer_top = $footer.offset().top;
    footer_inner_height = $footer_inner.outerHeight();

    $footer.height('auto');
    $footer_content.height('auto');
    $item_wrapper.height('auto');
    $item.show().height('auto');

    $item.each(function() {
      H = $(this).outerHeight() > H ? $(this).outerHeight() : H;
    });

    $footer.height(footer_inner_height + H);
    $footer_content.height(H);
    $item_wrapper.height(H);
    $first_item.height(H);
    $second_item.height(0);

    $footer.addClass('is-construct');
  }

  function start_sticky() {
    stickyInterval = setInterval(function() {
      var first_height = H + footer_top - $footer_inner.offset().top;
      var second_height = $footer_inner.offset().top - footer_top;

      if (first_height < 0) {
        first_height = 0;
        second_height = H;
      }

      if (second_height < 0) {
        first_height = H;
        second_height = 0;
      }

      $first_item.height(first_height);
      $second_item.height(second_height);
    }, 1);
  }
}