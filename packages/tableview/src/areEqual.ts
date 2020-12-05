import { ChildrenProps } from './Tableview';

type ObjectLike = {
  [attr: string]: any;
};

export function shallowEqual(prev: ObjectLike, next: ObjectLike): boolean {
  for (let attribute in prev) {
    if (!(attribute in next)) {
      return false;
    }
  }

  for (let attribute in next) {
    if (prev[attribute] !== next[attribute]) {
      return false;
    }
  }

  return true;
}

export function areEqual(
  prevProps: ChildrenProps,
  nextProps: ChildrenProps
): boolean {
  const { style: prevStyle, ...prevRest } = prevProps;
  const { style: nextStyle, ...nextRest } = nextProps;

  return shallowEqual(prevStyle, nextStyle) && shallowEqual(prevRest, nextRest);
}
