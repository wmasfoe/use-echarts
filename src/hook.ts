import type { ECharts } from "echarts";
import { ref, reactive, watch } from "vue";
import type { Ref } from "vue";
import { throttle } from 'lodash'

function toNum (val: string | number | boolean | []) {
  if(typeof val === 'string') {
    return parseInt(val, 10) || 0
  } else {
    return Number(val) || 0
  }
}

/**
 * @param chartWrapperRef 包裹 echarts 的容器
 * @param chart echarts 实例
 * @returns onZoom 缩放方法 | zoomSwitch 是否开启了缩放
 */
export function useDragZoom(
  chartWrapperRef: Ref<HTMLElement>,
  chart: Ref<ECharts>
) {
  // 鼠标开始百分比值
  let startX: number = 0;
  let startY: number = 0;
  // 鼠标结束百分比值
  let endX: number = 0;
  let endY: number = 0;

  // 按下时鼠标位置，后续 move 时对应的 x y，减去这个 x y
  let downStartX: number;
  let downStartY: number;

  // vue reactive
  const zoomSwitch = ref(false);
  const maskDomInstance = ref<HTMLDivElement>();
  const maskDomCSSStyle = reactive<Partial<CSSStyleDeclaration>>({});

  watch(
    maskDomCSSStyle,
    () => {
      for (const key in maskDomCSSStyle) {
        // @ts-ignore
        maskDomInstance.value.style[key] = maskDomCSSStyle[key];
      }
    },
    {
      deep: true,
    }
  );

  // 进行缩放
  function zoom() {
    // TODO
    startX = Math.floor(startX)
    endX = Math.floor(endX)
    startY = Math.floor(startY)
    endY = Math.floor(endY)

    // startX = (startX) > (endX) ? (endX) : (startX)
    // endX = (startX) > (endX) ? (startX) : (endX)
    // startY = (startY) > (endY) ? (endY) : (startY)
    // endY = (startY) > (endY) ? (startY) : (endY)

    console.debug(`startX === ${startX}`, `endX === ${endX}`, `startY == ${startY}`, `endY == ${endY}`)

    chart.value.dispatchAction({
      type: "dataZoom",
      batch: [
        {
          dataZoomIndex: 0,
          // x 轴
          start: startX,
          end: endX,
        },
        {
          // y 轴
          dataZoomIndex: 1,
          start: startY,
          end: endY,
        },
      ],
    });
  }
  // 重置缩放
  function resetZoom() {
    chart.value.dispatchAction({
      type: "dataZoom",
      batch: [
        {
          // x轴缩放
          start: 0,
          end: 100,
        },
        {
          // y轴缩放
          dataZoomIndex: 1,
          start: 0,
          end: 100,
        },
      ],
    });
  }

  // 获取容器样式
  function getWrapperStyle() {
    let wrapperWidth = chart.value.getWidth() || 0;
    let wrapperHeight = chart.value.getHeight() || 0;

    // 获取 gird 计算绘图区 width height
    // let grid;
    // if(Array.isArray(chart.value.getOption().grid)) {
    //   grid = (chart.value.getOption().grid as any[])[0] || {};
    // } else {
    //   grid = chart.value.getOption().grid || {}
    // }

    // wrapperWidth = wrapperWidth - toNum(grid.left) - toNum(grid.right)
    // wrapperHeight = wrapperHeight - toNum(grid.top) - toNum(grid.bottom)

    return {
      wrapperWidth,
      wrapperHeight,
    };
  }
  // 获取鼠标坐标
  function wrapperMousemoveCallback(event: MouseEvent) {
    const x = event.offsetX;
    const y = event.offsetY;

    maskDomCSSStyle.width = `${x - downStartX - 2}px`;
    maskDomCSSStyle.height = `${y - downStartY - 2}px`;

    const { wrapperWidth, wrapperHeight } = getWrapperStyle();

    const moveScaleX = Number((x / wrapperWidth).toFixed(2)) * 100;
    const moveScaleY = Number((y / wrapperHeight).toFixed(2)) * 100;

    return {
      moveScaleX,
      moveScaleY,
    };
  }
  // 节流后的事件
  const onMousemove = throttle(wrapperMousemoveCallback, 20)
  function wrapperMouseUpCallback(event: MouseEvent) {
    const { wrapperWidth, wrapperHeight } = getWrapperStyle();

    const x = event.offsetX;
    const y = Number(wrapperHeight) - event.offsetY
    chartWrapperRef.value?.removeEventListener(
      "mousemove",
      onMousemove
    );

    const upScaleX = Number((x / wrapperWidth).toFixed(2)) * 100;
    const upScaleY = Number((y / wrapperHeight).toFixed(2)) * 100;

    endX = upScaleX;
    endY = upScaleY;

    // 抬起进行缩放
    zoom();
    // 移除 mask
    chartWrapperRef.value.removeChild(maskDomInstance.value as HTMLDivElement);

    return {
      upScaleX,
      upScaleY,
    };
  }
  function wrapperMouseDownCallback(event: MouseEvent) {
    const { wrapperWidth, wrapperHeight } = getWrapperStyle();

    // 鼠标坐标
    const x = event.offsetX;
    const y = Number(wrapperHeight) - event.offsetY;
    downStartX = x
    downStartY = y

    // 相对定位
    chartWrapperRef.value.style.position = 'relative';
    // 创建 dom
    const maskDom = document.createElement("div");
    chartWrapperRef.value.appendChild(maskDom);

    maskDomCSSStyle.position = "absolute";
    maskDomCSSStyle.backgroundColor = "rgba(60, 102, 255, 0.1)";
    maskDomCSSStyle.pointerEvents = 'none'; // 不参与鼠标事件
    maskDomCSSStyle.zIndex = "100";
    maskDomCSSStyle.top = `${y}px`;
    maskDomCSSStyle.left = `${x}px`;
    maskDomCSSStyle.width = "0px";
    maskDomCSSStyle.height = "0px";

    const downScaleX = Number((x / wrapperWidth).toFixed(2)) * 100;
    const downScaleY = Number((y / wrapperHeight).toFixed(2)) * 100;

    startX = downScaleX;
    startY = downScaleY;

    maskDomInstance.value = maskDom;

    chartWrapperRef.value?.addEventListener(
      "mousemove",
      onMousemove
    );

    return {
      downScaleX,
      downScaleY,
    };
  }

  function onZoom() {
    chart.value.dispatchAction({
      type: "dataZoom",
      batch: [
        // {
        //   dataZoomIndex: 0,
        //   // x 轴
        //   start: 0,
        //   end: 50,
        // },
        {
          // y 轴
          dataZoomIndex: 1,
          start: 1,
          end: 50,
        },
      ],
    });
    zoomSwitch.value = !zoomSwitch.value;
    if (zoomSwitch.value) {
      // 监听
      chartWrapperRef.value?.addEventListener(
        "mousedown",
        wrapperMouseDownCallback
      );
      chartWrapperRef.value?.addEventListener(
        "mouseup",
        wrapperMouseUpCallback
      );
    } else {
      // 移除监听
      chartWrapperRef.value?.removeEventListener(
        "mousedown",
        wrapperMouseDownCallback
      );
      chartWrapperRef.value?.removeEventListener(
        "mouseup",
        wrapperMouseUpCallback
      );
      resetZoom();
    }
  }

  return {
    onZoom,
    zoomSwitch,
  };
}
