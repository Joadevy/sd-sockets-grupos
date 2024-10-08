export const groupAmount = 3;

export function isValidJson(jsonString) {
  try {
    JSON.parse(jsonString);
    return true; 
  } catch (e) {
    return false;
  }
}

export function readBytes(buffer, offset, length) {
  return buffer.slice(offset, offset + length);
}

export function isValidGroupNumber (groupNumber) {
  return !isNaN(Number(groupNumber)) && groupNumber >= 1 && groupNumber <= groupAmount;
}