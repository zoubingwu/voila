import React, { useCallback, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSpringValue, useTrail } from '../src';
import { data } from './data';

interface ItemProps {
  imgUrl: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  onExpand: Function;
  expand: boolean;
}

const Item: React.FC<ItemProps> = ({
  imgUrl,
  title,
  subtitle,
  description,
  price,
  onExpand,
  expand,
}) => {
  const bgRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const onClick = useCallback(() => {
    const bgRect = bgRef.current?.getBoundingClientRect();
    const imgRect = imgRef.current?.getBoundingClientRect();
    onExpand({
      imgUrl,
      title,
      subtitle,
      description,
      price,
      bgRect,
      imgRect,
    });
  }, [expand]);

  return (
    <div className="grid__item" onClick={onClick}>
      <div className="product">
        <div className="product__bg" ref={bgRef}></div>
        <img className="product__img" src={imgUrl} alt="" ref={imgRef} />
        <h2 className="product__title">{title}</h2>
        <h3 className="product__subtitle">{subtitle}</h3>
        <p className="product__description">{description}</p>
        <div className="product__price">${price}</div>
      </div>
    </div>
  );
};

type SelectedItem = Omit<ItemProps, 'onExpand' | 'expand'> & {
  imgRect?: DOMRect;
  bgRect?: DOMRect;
};

function App() {
  const [expand, setExpand] = useState(false);
  const [selected, setSelected] = useState<SelectedItem>(data[0]);
  const detailBgRef = useRef<HTMLDivElement>(null);
  const detailImgRef = useRef<HTMLImageElement>(null);
  const { imgUrl, title, subtitle, description, price } = selected;
  const [bgProps, setBgProps, hardSetBgProps] = useSpringValue({
    tx: 0,
    ty: 0,
    sx: 1,
    sy: 1,
    opacity: 0,
  });
  const [imgProps, setImgProps, hardSetImgProps] = useSpringValue({
    tx: 0,
    ty: 0,
    sx: 1,
    sy: 1,
    opacity: 0,
  });
  const [textProps, setTextProps, hardTextBgProps] = useTrail(7, {
    ty: 50,
    opacity: 0,
  });

  const getTransformProps = (
    initialRect: DOMRect,
    finalRect: DOMRect,
    expand: boolean
  ) => {
    return {
      tx: initialRect!.left - finalRect.left,
      ty: initialRect!.top - finalRect.top,
      sx: initialRect!.width / finalRect.width,
      sy: initialRect!.height / finalRect.height,
      opacity: expand ? 1 : 0,
    };
  };

  const onClick = useCallback(
    (item: SelectedItem) => {
      setSelected(item);
      setExpand(true);
      const { imgRect, bgRect } = item;
      hardSetBgProps(
        getTransformProps(
          bgRect!,
          detailBgRef.current!.getBoundingClientRect(),
          true
        )
      );
      hardSetImgProps(
        getTransformProps(
          imgRect!,
          detailImgRef.current!.getBoundingClientRect(),
          true
        )
      );
      hardTextBgProps({ ty: 50, opacity: 0 });
      requestAnimationFrame(() => {
        setBgProps({ tx: 0, ty: 0, sx: 1, sy: 1 });
        setImgProps({ tx: 0, ty: 0, sx: 1, sy: 1 });
        setTextProps({ ty: 0, opacity: 1 });
      });
    },
    [setSelected, bgProps]
  );

  const onClose = useCallback(() => {
    const { bgRect, imgRect } = selected;
    setBgProps(
      getTransformProps(
        bgRect!,
        detailBgRef.current!.getBoundingClientRect(),
        false
      )
    );
    setImgProps(
      getTransformProps(
        imgRect!,
        detailImgRef.current!.getBoundingClientRect(),
        false
      )
    );
    hardTextBgProps({ ty: 0, opacity: 0 });
    setTimeout(() => {
      setExpand(false);
    }, 300);
  }, [selected]);

  return (
    <div className="content">
      <div className="grid">
        {data.map((item, index) => (
          <Item {...item} key={index} expand={expand} onExpand={onClick} />
        ))}
      </div>

      <div
        onClick={onClose}
        className={`details ${expand ? 'details--open' : ''}`}
      >
        <div
          className="details__bg details__bg--up"
          style={{ opacity: bgProps.opacity }}
        ></div>
        <div
          className="details__bg details__bg--down"
          ref={detailBgRef}
          style={{
            transform: expand
              ? `translateX(${bgProps.tx}px) translateY(${bgProps.ty}px) scaleX(${bgProps.sx}) scaleY(${bgProps.sy})`
              : `none`,
            opacity: bgProps.opacity,
          }}
        ></div>
        <img
          className="details__img"
          src={imgUrl}
          alt=""
          ref={detailImgRef}
          style={{
            transform: expand
              ? `translateX(${imgProps.tx}px) translateY(${imgProps.ty}px) scaleX(${imgProps.sx}) scaleY(${imgProps.sy})`
              : 'none',
            opacity: bgProps.opacity,
          }}
        />
        <h2
          className="details__title"
          style={{
            transform: `translateY(${textProps[0].ty}px) scale(1)`,
            opacity: expand ? textProps[1].opacity : 0,
          }}
        >
          {title}
        </h2>
        <div
          className="details__deco"
          style={{
            backgroundImage: `url(${imgUrl})`,
            transform: `translateY(${textProps[1].ty}px)`,
            opacity: expand ? textProps[2].opacity : 0,
          }}
        ></div>
        <h3
          className="details__subtitle"
          style={{
            transform: `translateY(${textProps[2].ty}px)`,
            opacity: expand ? textProps[3].opacity : 0,
          }}
        >
          {subtitle}
        </h3>
        <div
          className="details__price"
          style={{
            transform: `translateY(${textProps[3].ty}px)`,
            opacity: expand ? textProps[4].opacity : 0,
          }}
        >
          ${price}
        </div>
        <p
          className="details__description"
          style={{
            transform: `translateY(${textProps[4].ty}px)`,
            opacity: expand ? textProps[5].opacity : 0,
          }}
        >
          {description}
        </p>
        <button
          className="details__addtocart"
          style={{
            transform: `translateY(${textProps[5].ty}px)`,
            opacity: expand ? textProps[6].opacity : 0,
          }}
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.querySelector('#app'));
