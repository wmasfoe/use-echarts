<script setup lang="ts">
import { onMounted, ref, nextTick, computed, Ref } from "vue";
import * as echarts from "echarts";
import { useDragZoom } from './hook'

const chartRef = ref<HTMLElement>();
const chart = ref();

onMounted(async () => {
  await nextTick();
  const myChart = echarts.init(chartRef.value as HTMLElement);
  let option;

  option = {
    legend: {},
    toolbox: {
      feature: {
        dataZoom: {
          // TODO 必须配置 dataZoom，自定义可以设置 show 为 false
          show: false,
          // !! 这里 index 要和下面 dispatch 对应
          xAxisIndex: 0,
          yAxisIndex: 1,
        },
      },
    },
  xAxis: {
    type: 'value'
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      symbolSize: 20,
      data: [
        [10.0, 8.04],
        [8.07, 6.95],
        [13.0, 7.58],
        [9.05, 8.81],
        [11.0, 8.33],
        [14.0, 7.66],
        [13.4, 6.81],
        [10.0, 6.33],
        [14.0, 8.96],
        [12.5, 6.82],
        [9.15, 7.2],
        [11.5, 7.2],
        [3.03, 4.23],
        [12.2, 7.83],
        [2.02, 4.47],
        [1.05, 3.33],
        [4.05, 4.96],
        [6.03, 7.24],
        [12.0, 6.26],
        [12.0, 8.84],
        [7.08, 5.82],
        [5.02, 5.68]
      ],
      type: 'scatter'
    }
  ],
    grid: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    }
  };

  option && myChart.setOption(option);
  chart.value = myChart;
});
const {
  onZoom,
  zoomSwitch
} = useDragZoom(chartRef as Ref<HTMLElement>, chart)

const zoomBtnText = computed(() =>
  zoomSwitch.value ? "重置缩放" : "开启缩放"
);
</script>

<template>
  <div class="container" ref="chartRef"></div>
  <button v-text="zoomBtnText" @click="onZoom" />
</template>

<style scoped>
.container {
  width: 100%;
  height: 600px;
}
</style>
