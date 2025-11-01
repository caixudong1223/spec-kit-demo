// 图片编辑标注组件 - 数据验证工具
import type { EditorImage, AnnotationNode, AnnotationLine } from '@/types/image-editor'

// ========== 通用验证函数 ==========

/**
 * 验证是否为有效的 UUID v4
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * 验证是否为有效的 CSS 颜色值
 */
export function isValidColor(color: string): boolean {
  const s = new Option().style
  s.color = color
  return s.color !== ''
}

/**
 * 验证数值是否在指定范围内
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * 验证是否为有效的 ISO 8601 日期字符串
 */
export function isValidISODate(date: string): boolean {
  return !isNaN(Date.parse(date))
}

// ========== 实体验证器 ==========

/**
 * 验证图片实体
 * @returns 错误消息数组，为空则验证通过
 */
export function validateEditorImage(image: EditorImage): string[] {
  const errors: string[] = []

  if (!isValidUUID(image.id)) {
    errors.push('Invalid image ID')
  }

  if (!image.name || image.name.length > 255) {
    errors.push('Invalid image name')
  }

  if (!isInRange(image.rotation, 0, 360)) {
    errors.push('Rotation out of range (0-360)')
  }

  if (!isInRange(image.scale.x, 0.1, 5.0)) {
    errors.push('Scale X out of range (0.1-5.0)')
  }

  if (!isInRange(image.scale.y, 0.1, 5.0)) {
    errors.push('Scale Y out of range (0.1-5.0)')
  }

  if (!isInRange(image.zIndex, 0, 999)) {
    errors.push('Z-index out of range (0-999)')
  }

  if (image.fileSize <= 0) {
    errors.push('Invalid file size')
  }

  if (!isValidISODate(image.createdAt)) {
    errors.push('Invalid createdAt date')
  }

  if (!isValidISODate(image.modifiedAt)) {
    errors.push('Invalid modifiedAt date')
  }

  return errors
}

/**
 * 验证标注节点
 * @returns 错误消息数组，为空则验证通过
 */
export function validateAnnotationNode(node: AnnotationNode): string[] {
  const errors: string[] = []

  if (!isValidUUID(node.id)) {
    errors.push('Invalid node ID')
  }

  if (node.number < 1) {
    errors.push('Invalid node number (must be >= 1)')
  }

  if (!isValidColor(node.style.fill)) {
    errors.push('Invalid fill color')
  }

  if (!isValidColor(node.style.stroke)) {
    errors.push('Invalid stroke color')
  }

  if (!isValidColor(node.style.textColor)) {
    errors.push('Invalid text color')
  }

  if (!isInRange(node.style.radius, 10, 50)) {
    errors.push('Radius out of range (10-50)')
  }

  if (!isInRange(node.style.strokeWidth, 1, 10)) {
    errors.push('Stroke width out of range (1-10)')
  }

  if (!isInRange(node.style.fontSize, 12, 24)) {
    errors.push('Font size out of range (12-24)')
  }

  if (!isValidISODate(node.createdAt)) {
    errors.push('Invalid createdAt date')
  }

  if (!isValidISODate(node.modifiedAt)) {
    errors.push('Invalid modifiedAt date')
  }

  return errors
}

/**
 * 验证标注线
 * @returns 错误消息数组，为空则验证通过
 */
export function validateAnnotationLine(line: AnnotationLine): string[] {
  const errors: string[] = []

  if (!isValidUUID(line.id)) {
    errors.push('Invalid line ID')
  }

  if (line.text.length > 100) {
    errors.push('Text too long (max 100 characters)')
  }

  if (!isValidColor(line.style.stroke)) {
    errors.push('Invalid stroke color')
  }

  if (!isValidColor(line.style.textColor)) {
    errors.push('Invalid text color')
  }

  if (!isValidColor(line.style.textBackground)) {
    errors.push('Invalid text background color')
  }

  if (!isInRange(line.style.strokeWidth, 1, 10)) {
    errors.push('Stroke width out of range (1-10)')
  }

  if (!isInRange(line.style.fontSize, 10, 24)) {
    errors.push('Font size out of range (10-24)')
  }

  // 验证线段长度（起点和终点不能完全重合）
  const distance = Math.sqrt(
    Math.pow(line.points.end.x - line.points.start.x, 2) +
      Math.pow(line.points.end.y - line.points.start.y, 2)
  )
  if (distance < 5) {
    errors.push('Line too short (minimum 5 pixels)')
  }

  if (!isValidISODate(line.createdAt)) {
    errors.push('Invalid createdAt date')
  }

  if (!isValidISODate(line.modifiedAt)) {
    errors.push('Invalid modifiedAt date')
  }

  return errors
}

/**
 * 生成 UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 获取当前 ISO 时间戳
 */
export function getCurrentISOTime(): string {
  return new Date().toISOString()
}
