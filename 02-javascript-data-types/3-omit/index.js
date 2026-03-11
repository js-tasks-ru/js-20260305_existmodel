/**
 * omit - creates an object composed of enumerable property fields
 * @param {object} obj - the source object
 * @param {...string} fields - the properties paths to omit
 * @returns {object} - returns the new object
 */
export const omit = (obj, ...fields) => {
  let arr = Object.entries(obj);
  let filteredArr = arr.filter(([key]) => !fields.includes(key));
  let result = Object.fromEntries(filteredArr);
  return result;
};

const fruits = {
  apple: 2,
  orange: 4,
  banana: 3,
};

omit(fruits, "apple", "banana");

console.log(omit(fruits, "apple", "banana"));
