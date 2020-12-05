import React, {
  ComponentType,
  createElement,
  CSSProperties,
  ReactElement,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface ChildrenProps {
  index: number;
  style: CSSProperties;
  data?: any;
}

export interface CommonProps {
  className?: string;
  style?: CSSProperties;
}

export interface TableViewProps extends CommonProps {
  className?: string;
  height: number;
  width: number;
  itemCount: number;
  rowHeight: number;
  children: ComponentType<ChildrenProps>;
  thresholdCount?: number;
  getItemKey?: (index: number, dataSource: any) => number;
  dataSource: any[];
  onLoadMoreData?: () => void;
  isDataFullyLoaded?: boolean;
}

interface TableViewState {
  isScrolling: boolean;
  scrollDirection: 'up' | 'down';
  scrollOffset: number;
}

function defaultGetItemKey(index: number) {
  return index;
}

function noop() {}

export const TableView: React.FC<TableViewProps> = ({
  className,
  height,
  width,
  style,
  rowHeight,
  itemCount,
  thresholdCount = 1,
  children,
  getItemKey = defaultGetItemKey,
  dataSource,
  onLoadMoreData = noop,
  isDataFullyLoaded = true,
}) => {
  const [
    { isScrolling, scrollDirection, scrollOffset },
    setState,
  ] = useState<TableViewState>({
    isScrolling: false,
    scrollDirection: 'down',
    scrollOffset: 0,
  });

  const debouncedResetScrollingRef = useRef<{ id: number | null }>({
    id: null,
  });

  const onScroll = useCallback(
    (event: SyntheticEvent<HTMLDivElement>): void => {
      const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
      const scrollOffset = Math.max(
        0,
        Math.min(scrollTop, scrollHeight - clientHeight)
      );
      setState((prevState) => {
        if (prevState.scrollOffset === scrollTop) return prevState;
        return {
          isScrolling: true,
          scrollDirection:
            prevState.scrollOffset < scrollOffset ? 'down' : 'up',
          scrollOffset,
        };
      });

      if (debouncedResetScrollingRef.current.id) {
        clearTimeout(debouncedResetScrollingRef.current.id);
      }
      debouncedResetScrollingRef.current.id = setTimeout(() => {
        setState((prevState) => ({ ...prevState, isScrolling: false }));
      }, 200);
    },
    [debouncedResetScrollingRef.current.id]
  );

  const estimatedTotalSize = useMemo(() => {
    return rowHeight * itemCount;
  }, [rowHeight, itemCount]);

  const [startIndex, endIndex] = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.min(itemCount - 1, Math.floor(scrollOffset / rowHeight))
    );
    const offset = startIndex * rowHeight;
    const countOfVisibleItems = Math.ceil(
      (height + scrollOffset - offset) / rowHeight
    );
    const endIndex = Math.max(
      0,
      Math.min(itemCount - 1, startIndex + countOfVisibleItems - 1)
    );
    const overscanBackward =
      !isScrolling || scrollDirection === 'up'
        ? Math.max(1, thresholdCount)
        : 1;
    const overscanForward =
      !isScrolling || scrollDirection === 'down'
        ? Math.max(1, thresholdCount)
        : 1;

    return [
      Math.max(0, startIndex - overscanBackward),
      Math.max(0, Math.min(itemCount - 1, endIndex + overscanForward)),
    ] as [number, number];
  }, [rowHeight, itemCount, scrollOffset, scrollDirection, isScrolling]);

  const itemStyles = useRef<Map<number, CSSProperties>>(new Map());

  const getItemStyles = useCallback((index: number) => {
    if (itemStyles.current.has(index)) {
      return itemStyles.current.get(index)!;
    }

    const offset = index * rowHeight;
    const style: CSSProperties = {
      position: 'absolute',
      top: offset,
      height: rowHeight,
      width: '100%',
    };

    itemStyles.current.set(index, style);
    return style;
  }, []);

  const items = useMemo(() => {
    const res: ReactElement[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const childrenProps = {
        index: i,
        style: getItemStyles(i),
        key: getItemKey(i, dataSource),
        data: dataSource,
      };
      res.push(createElement(children, childrenProps));
    }
    return res;
  }, [startIndex, endIndex, isScrolling, dataSource]);

  useEffect(() => {
    if (isDataFullyLoaded) return;
    if (endIndex + thresholdCount >= itemCount) {
      onLoadMoreData();
    }
  }, [endIndex, itemCount]);

  return (
    <div
      className={className}
      onScroll={onScroll}
      style={{
        position: 'relative',
        height,
        width,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        willChange: 'transform',
        ...style,
      }}
    >
      <div
        style={{
          height: estimatedTotalSize,
          pointerEvents: isScrolling ? 'none' : undefined,
          width: '100%',
        }}
      >
        {items}
      </div>
    </div>
  );
};
