import easingTypes from 'tween-functions';
import requestAnimationFrame from 'raf';
import EventListener from './EventDispatcher';
import { currentScrollTop } from './util';
import mapped from './Mapped';

// 设置默认数据
function defaultData(vars) {
  return {
    ease: vars.ease || 'easeInOutQuad',
    duration: vars.duration || 450,
    docHeight: vars.docHeight,
    scrollInterval: vars.scrollInterval || 1000,
    loop: vars.loop || false
  };
}

var ScrollScreen = {
  init: function init(vars) {
    var _this = this;

    this.vars = defaultData(vars || {});
    this.rafID = -1;
    this.toHeight = -1;
    this.num = 0;
    // this.currentNum = 0;
    ['raf', 'cancelRequestAnimationFrame', 'onWheel', 'startScroll', 'isScroll'].forEach(function (method) {
      _this[method] = _this[method].bind(_this);
    });
    EventListener.addEventListener('wheel.scrollWheel', this.onWheel);
    // 刚进入时滚动条位置
    setTimeout(this.startScroll);
  },
  startScroll: function startScroll() {
    var _this2 = this;

    var _mapped = mapped.getMapped();
    var _arr = _mapped.__arr;
    if (!_arr.length) {
      EventListener.removeEventListener('wheel.scrollWheel', this.onWheel);
      return;
    }
    this.scrollTop = currentScrollTop();
    _arr.forEach(function (str, i) {
      var dom = _mapped[str];
      var domOffsetTop = dom.offsetTop;
      var domHeight = dom.getBoundingClientRect().height;
      if (_this2.scrollTop >= domOffsetTop && _this2.scrollTop < domOffsetTop + domHeight) {
        _this2.num = i;
        _this2.toHeight = domOffsetTop;
      }
    });
    // 如果 toHeight === -1 且 this.scrollTop 有值时；
    if (this.toHeight === -1) {
      if (this.scrollTop > 0) {
        var endDom = mapped.get(mapped.getMapped().__arr[mapped.getMapped().__arr.length - 1]);
        var windowHeight = document.documentElement.clientHeight;
        var tooNum = Math.ceil((this.scrollTop - endDom.offsetTop - endDom.getBoundingClientRect().height) / windowHeight);
        this.num = mapped.getMapped().__arr.length + tooNum;
      }
      return;
    }
    if (this.toHeight !== this.scrollTop) {
      this.initTime = Date.now();
      this.rafID = requestAnimationFrame(this.raf);
    } else {
      this.toHeight = -1;
    }
  },
  raf: function raf() {
    var _this3 = this;

    var duration = this.vars.duration;
    var now = Date.now();
    var progressTime = now - this.initTime > duration ? duration : now - this.initTime;
    var easeValue = easingTypes[this.vars.ease](progressTime, this.scrollTop, this.toHeight, duration);
    window.scrollTo(window.scrollX, easeValue);
    if (progressTime === duration) {
      this.cancelRequestAnimationFrame();
      setTimeout(function () {
        _this3.toHeight = -1;
      }, this.vars.scrollInterval);
    } else {
      this.rafID = requestAnimationFrame(this.raf);
    }
  },
  cancelRequestAnimationFrame: function cancelRequestAnimationFrame() {
    requestAnimationFrame.cancel(this.rafID);
    this.rafID = -1;
  },
  getComputedStyle: function getComputedStyle(dom) {
    return document.defaultView ? document.defaultView.getComputedStyle(dom) : {};
  },
  isScroll: function isScroll(dom) {
    var style = this.getComputedStyle(dom);
    var overflow = style.overflow;
    var overflowY = style.overflowY;
    var isScrollOverflow = overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay' || overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
    if (dom === document.body) {
      return false;
    } else if (dom.scrollHeight > dom.offsetHeight && isScrollOverflow && dom.scrollTop < dom.scrollHeight) {
      return true;
    }
    return this.isScroll(dom.parentNode);
  },
  onWheel: function onWheel(e) {
    var _this4 = this;

    var _mapped = mapped.getMapped();
    if (!_mapped.__arr.length) {
      EventListener.removeEventListener('wheel.scrollWheel', this.onWheel);
      return;
    }
    if (this.isScroll(e.target)) {
      return;
    }
    var deltaY = e.deltaY;
    e.preventDefault();
    if (this.rafID === -1 && deltaY !== 0 && this.toHeight === -1) {
      // 如果滚动条托动过了，需要获取当前的num;
      var _arr = _mapped.__arr;
      var endDom = mapped.get(_arr[_arr.length - 1]);
      var startDom = mapped.get(_arr[0]);
      var windowHeight = document.documentElement.clientHeight;
      this.scrollTop = currentScrollTop();
      _arr.forEach(function (str, i) {
        var dom = _mapped[str];
        var domOffsetTop = dom.offsetTop;
        var domHeight = dom.getBoundingClientRect().height;
        if (_this4.scrollTop >= domOffsetTop && _this4.scrollTop < domOffsetTop + domHeight) {
          _this4.num = i;
        }
      });
      var startManyHeight = startDom.offsetTop;
      var startManyScale = startManyHeight ? Math.ceil(startManyHeight / windowHeight) : 0;
      var tooNum = void 0;
      if (this.scrollTop > endDom.offsetTop + endDom.getBoundingClientRect().height) {
        tooNum = Math.ceil((this.scrollTop - endDom.offsetTop - endDom.getBoundingClientRect().height) / windowHeight);
        this.num = _arr.length + tooNum;
      } else if (this.scrollTop < startDom.offsetTop) {
        tooNum = Math.ceil(-(this.scrollTop - startManyHeight) / windowHeight);
        this.num = -tooNum;
      }
      if (deltaY < 0) {
        this.num;
      } else if (deltaY > 0) {
        this.num++;
      }
      var docHeight = this.vars.docHeight || document.body.scrollHeight;
      var manyHeight = docHeight - endDom.offsetTop - endDom.getBoundingClientRect().height;
      var manyScale = manyHeight ? Math.ceil(manyHeight / windowHeight) : 0;
      var maxNum = _arr.length + manyScale;
      if (this.vars.loop) {
        this.num = this.num < -startManyScale ? maxNum - 1 : this.num;
        this.num = this.num >= maxNum ? -startManyScale : this.num;
      } else {
        this.num = this.num <= -startManyScale ? -startManyScale : this.num;
        this.num = this.num >= maxNum ? maxNum : this.num;
      }
      this.initTime = Date.now();
      var currentDom = mapped.get(mapped.getMapped().__arr[this.num]);
      this.toHeight = currentDom ? currentDom.offsetTop : null;
      this.toHeight = typeof this.toHeight !== 'number' ? endDom.offsetTop + endDom.getBoundingClientRect().height + windowHeight * (this.num - mapped.getMapped().__arr.length) : this.toHeight;
      this.toHeight = this.toHeight < 0 ? 0 : this.toHeight;
      this.toHeight = this.toHeight > docHeight - windowHeight ? docHeight - windowHeight : this.toHeight;
      this.rafID = requestAnimationFrame(this.raf);
      this.currentNum = this.num;
    }
  },
  unMount: function unMount() {
    EventListener.removeEventListener('wheel.scrollWheel', this.onWheel);
  }
};
export default {
  init: ScrollScreen.init.bind(ScrollScreen),
  unMount: ScrollScreen.unMount.bind(ScrollScreen)
};