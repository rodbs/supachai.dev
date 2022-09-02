/**
 * Returns the string of class names for a given list of classes.
 * This function filters out any non-string values from an array of classes.
 * It also filters out any empty strings.
 * It is useful when you want to conditionally add classes to an element along with base classes.
 * Example: `className={classNames(isActive ? 'font-bold' : '', 'text-zinc-600')}`
 * @param {...string} classes - The class names to add
 * @returns {string} The class names as a string
 */
export function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ')
}
