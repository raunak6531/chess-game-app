import React from "react";
import { gsap } from "gsap";
import './FlowingMenu.css';

interface MenuItemProps {
  link: string;
  text: string;
  image: string;
  onClick?: () => void;
}

interface FlowingMenuProps {
  items?: MenuItemProps[];
}

const FlowingMenu: React.FC<FlowingMenuProps> = ({ items = [] }) => {
  return (
    <div className="flowing-menu-container">
      <nav className="flowing-menu-nav">
        {items.map((item, idx) => (
          <MenuItem key={idx} {...item} />
        ))}
      </nav>
    </div>
  );
};

const MenuItem: React.FC<MenuItemProps> = ({ link, text, image, onClick }) => {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const marqueeRef = React.useRef<HTMLDivElement>(null);
  const marqueeInnerRef = React.useRef<HTMLDivElement>(null);
  const animationDefaults = { duration: 0.6, ease: "expo" };

  const findClosestEdge = (
    mouseX: number,
    mouseY: number,
    width: number,
    height: number
  ): "top" | "bottom" => {
    const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY, 2);
    const bottomEdgeDist =
      Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  // Show animation at a given client position
  const showAnimation = (clientX: number, clientY: number) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current)
      return;

    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      clientX - rect.left,
      clientY - rect.top,
      rect.width,
      rect.height
    );

    const tl = gsap.timeline({ defaults: animationDefaults });
    tl.set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" })
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" })
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" });
  };

  // Hide animation, sliding back toward the nearest edge
  const hideAnimation = (clientX: number, clientY: number) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current)
      return;

    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      clientX - rect.left,
      clientY - rect.top,
      rect.width,
      rect.height
    );

    const tl = gsap.timeline({ defaults: animationDefaults });
    tl.to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }).to(
      marqueeInnerRef.current,
      { y: edge === "top" ? "101%" : "-101%" },
      "<"
    );
  };

  // Pointer-based handlers unify mouse/touch/pen
  const handlePointerEnter = (ev: React.PointerEvent<HTMLAnchorElement>) => {
    if (ev.pointerType === 'mouse') {
      showAnimation(ev.clientX, ev.clientY);
    }
  };

  const handlePointerLeave = (ev: React.PointerEvent<HTMLAnchorElement>) => {
    if (ev.pointerType === 'mouse') {
      hideAnimation(ev.clientX, ev.clientY);
    }
  };

  const handlePointerDown = (ev: React.PointerEvent<HTMLAnchorElement>) => {
    showAnimation(ev.clientX, ev.clientY);
  };

  const handlePointerUp = (ev: React.PointerEvent<HTMLAnchorElement>) => {
    hideAnimation(ev.clientX, ev.clientY);
    if (onClick) {
      ev.preventDefault();
      onClick();
    }
  };

  const handlePointerCancel = (ev: React.PointerEvent<HTMLAnchorElement>) => {
    hideAnimation(ev.clientX, ev.clientY);
  };

  const handleKeyDown = (ev: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (onClick && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      onClick();
    }
  };

  const repeatedMarqueeContent = React.useMemo(() => {
    return Array.from({ length: 4 }).map((_, idx) => (
      <React.Fragment key={idx}>
        <span className="menu-marquee-text">
          {text}
        </span>
        <div
          className="menu-marquee-icon"
          style={{ backgroundImage: `url(${image})` }}
        />
      </React.Fragment>
    ));
  }, [text, image]);

  return (
    <div
      className="menu-item"
      ref={itemRef}
    >
      <a
        className="menu-item-link"
        href={link}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleKeyDown}
        aria-label={text}
      >
        {text}
      </a>
      <div
        className="menu-marquee"
        ref={marqueeRef}
      >
        <div className="menu-marquee-inner" ref={marqueeInnerRef}>
          <div className="menu-marquee-content">
            {repeatedMarqueeContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowingMenu;
