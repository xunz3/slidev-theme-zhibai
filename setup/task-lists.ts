const TASK_INPUT_SELECTOR = [
  '.slidev-layout li.task-list-item > input[type="checkbox"]',
  '.slidev-layout li.task-list-item > label > input[type="checkbox"]',
  '.slidev-layout .contains-task-list > li > input[type="checkbox"]',
  '.slidev-layout .contains-task-list > li > label > input[type="checkbox"]',
].join(', ')

type TaskRoot = Document | Element

const taskInputsWithin = (root: TaskRoot): HTMLInputElement[] => {
  const inputs = new Set<HTMLInputElement>()
  if (root instanceof Element
    && root.matches(TASK_INPUT_SELECTOR)
    && root instanceof HTMLInputElement) {
    inputs.add(root)
  }
  for (const input of root.querySelectorAll<HTMLInputElement>(
    TASK_INPUT_SELECTOR,
  )) {
    inputs.add(input)
  }
  return [...inputs]
}

const normalizeTaskInput = (input: HTMLInputElement) => {
  const checked = input.checked
  input.disabled = true
  input.tabIndex = -1
  input.dataset.presentationTask = 'true'
  input.dataset.presentationTaskChecked = String(checked)
  input.checked = checked

  const item = input.closest('li')
  const hasAccessibleName = Boolean(
    input.labels?.length
    || input.getAttribute('aria-label')?.trim()
    || input.getAttribute('aria-labelledby')?.trim(),
  )
  if (!hasAccessibleName && item) {
    const label = [...item.childNodes]
      .filter(node => node !== input)
      .filter(node => !(
        node instanceof Element
        && (node.matches('ul, ol') || node.contains(input))
      ))
      .map(node => node.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    input.setAttribute(
      'aria-label',
      label || (checked ? 'Completed presentation task' : 'Presentation task'),
    )
  }
  if (item && !item.classList.contains('presentation-task-item')) {
    item.classList.add('presentation-task-item')
  }
  if (
    item
    && item.classList.contains('presentation-task-item--checked') !== checked
  ) {
    item.classList.toggle('presentation-task-item--checked', checked)
  }
  if (item) item.dataset.presentationTaskState = checked ? 'checked' : 'unchecked'
  const list = input.closest('ul, ol')
  if (list && !list.classList.contains('presentation-task-list')) {
    list.classList.add('presentation-task-list')
  }
}

export const normalizePresentationTaskLists = (
  root?: TaskRoot,
): number => {
  if (typeof document === 'undefined') return 0
  const scope = root ?? document
  const inputs = taskInputsWithin(scope)
  for (const input of inputs) normalizeTaskInput(input)
  return inputs.length
}
