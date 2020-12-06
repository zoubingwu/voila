This monorepo use yarn workspace to manage depencencies.

## development

install dependencies

```sh
yarn
```

formatter

```sh
yarn fmt
```

run example project in each package

```sh
yarn workspace animation exmaple
yarn workspace tableview exmaple
```

build each package

```sh
yarn workspace animation build
yarn workspace tableview build
```

It contains the following packges:

## animation

You can check the example at [https://voila-animation.vercel.app/](https://voila-animation.vercel.app/)

This pakage implemented a spring physics based React animation primitive called **SpringValue**.

It exposed two simple to use react hooks API: **useSpringValue** and **useTrail**.

#### useSpringValue

This turns any value into spring based values, given an initial value, and once you set it to another value, it will recalculate and triggers re-render on each frame.

It accepts any number values, and returns spring based value and setter functions.

```js
const [props, set, hardSet] = useSpringValue({ opacity: 0 });

<div style={{ opacity: props.opacity }}/>

// This triggers animation and re-renders on each frame
set({ opacity: 1 })

// This sets tha value immediately and there won't be any animations.
hardSet({ opacity: 1 })
```

#### useTrail

This creates multiple spring values with same initial value and config, but each one will follow the previous one. It is good for staggered animations.

```js
// tell it how many springs you want
const [props, set, hardSet] = useTrail(5, { opacity: 0 });


props.map((p, index) => <div style={{ opacity: p.opacity }} key={index} />)

// This triggers animation start and each element will follow the previous one
set({ opacity: 1 })

// This sets tha value immediately and there won't be any animations.
hardSet({ opacity: 1 })
```

## tableview

check demo in [https://voila-tableview.vercel.app/](https://voila-tableview.vercel.app/)

This package implemented a performant virtual list React component that only renders elements in viewport. It also supports loading data infinitely.

| props  | type  | required  | description  |
|---|---|---|---|
| height  | number  | true  | Total height of the list component  |
| width  | number  |  false | Total width of the list component, this is optional  |
| itemCount  | number  | true  | Total number of items in the list  |
| rowHeight  | number  |  true | Row height of item  |
| children  | ComponentType  | true  | Tells list component how to render each item  |
| thresholdCount  | number  | false  | The number of items (rows) to render outside of the visible area, this also tells list when to trigger load more data   |
| getItemKey  | (index: number, dataSource: any) => number  | false  | You can use this props to specify your own keys for items  |
| dataSource  | any[]  | false  | Contextual data to be passed to the item renderer as a data prop  |
| onLoadMoreData  | () => void  |  false | Load more data from remote server or other place  |
| isDataFullyLoaded  | boolean  |  false | Tells list component should keep triggering load more data  |
| className  | string  |  false | Optional CSS class to attach to outermos element.  |
| style  | CSSProperties  |  false | Optional inline style   |
