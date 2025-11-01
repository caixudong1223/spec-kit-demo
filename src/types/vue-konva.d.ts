// vue-konva 类型声明
declare module 'vue-konva' {
  import { Plugin } from 'vue'
  const VueKonva: Plugin
  export default VueKonva

  // 组件类型声明
  export const VStage: any
  export const VLayer: any
  export const VImage: any
  export const VTransformer: any
  export const VGroup: any
  export const VCircle: any
  export const VText: any
  export const VLine: any
  export const VArrow: any
  export const VRect: any
}
