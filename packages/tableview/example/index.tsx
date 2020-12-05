import React, { useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { TableView, areEqual } from '../src';

const Item = React.memo(function ItemRenderer({ index, style, data }) {
  return (
    <div style={style} className="item">
      Row {index}, id {data[index].id}
    </div>
  );
}, areEqual);

function itemKey(index, data) {
  return data[index].id;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const data = new Array(100).fill(0).map((n, i) => ({ id: i + 10000 }));

function App() {
  const [state, setState] = useState(data);
  const [loading, setLoading] = useState(false);
  const [fullyLoaded, setFullyloaded] = useState(false);

  const onLoadMoreData = useCallback(async () => {
    if (loading) return;
    console.log('loading next page of data...');
    setLoading(true);
    await delay(1000);
    setState((prevState) => {
      const nextState = [...prevState].concat(
        new Array(100)
          .fill(0)
          .map((_, i) => ({ id: prevState.length + i + 10000 }))
      );
      return nextState;
    });
    setLoading(false);
    console.log('loading next page of data done!');
  }, [loading]);

  return (
    <TableView
      height={500}
      width={300}
      itemCount={state.length}
      rowHeight={30}
      dataSource={state}
      thresholdCount={1}
      getItemKey={itemKey}
      onLoadMoreData={onLoadMoreData}
      isDataFullyLoaded={fullyLoaded}
    >
      {Item}
    </TableView>
  );
}

ReactDOM.render(<App />, document.querySelector('#app'));
