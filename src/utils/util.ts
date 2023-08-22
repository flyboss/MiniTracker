
export function sortByKey<T>(array: Array<T>, key: string):Array<T> {
  return array.sort(function (a, b) {
    const x = a[key];
    const y = b[key];
    return x < y ? 1 : x > y ? -1 : 0;
  });
}

export function sortMapByValue(map:Map<string,number>):Map<string,number>{
  return new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
}

// https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
export function mapReplacer(key, value) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}

export function mapReviver(key, value) {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}
