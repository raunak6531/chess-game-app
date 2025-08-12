import React from "react";
import { gsap } from "gsap";
import './FlowingMenu.css';

interface MenuItemProps {
  link: string;
  text: string;
  image: string;
  onClick?: () => void;
  isActive?: boolean;
  onActivate?: () => void;
}

interface FlowingMenuProps {
  items?: MenuItemProps[];
}

const FlowingMenu: React.FC<FlowingMenuProps> = ({ items = [] }) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  return (
    <div className="flowing-menu-container">
      <nav className="flowing-menu-nav">
        {items.map((item, idx) => (
          <MenuItem
            key={idx}
            {...item}
            isActive={activeIndex === idx}
            onActivate={() => setActiveIndex(idx)}
            // Only persist on click/tap for touch devices
            // For desktop (hover), clear active on mouseleave from item
          />
        ))}
      </nav>
    </div>
  );
};

const MenuItem: React.FC<MenuItemProps> = ({ link, text, image, onClick, isActive, onActivate }) => {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const marqueeRef = React.useRef<HTMLDivElement>(null);
  const marqueeInnerRef = React.useRef<HTMLDivElement>(null);
  const animationDefaults = { duration: 0.6, ease: "expo" };
  const isTouchDevice = React.useMemo(() => (typeof window !== 'undefined') && matchMedia('(pointer: coarse)').matches, []);

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
    if (!isTouchDevice && ev.pointerType === 'mouse') {
      showAnimation(ev.clientX, ev.clientY);
    }
  };

  const handlePointerLeave = (ev: React.PointerEvent<HTMLAnchorElement>) => {
    if (!isTouchDevice && ev.pointerType === 'mouse') {
      hideAnimation(ev.clientX, ev.clientY);
    }
  };

  const handlePointerDown = (ev: React.PointerEvent<HTMLAnchorElement>) => {
    // On touch: instantly reveal and persist; on desktop: no persist on click
    if (marqueeRef.current && marqueeInnerRef.current) {
      gsap.killTweensOf([marqueeRef.current, marqueeInnerRef.current]);
      if (isTouchDevice || ev.pointerType !== 'mouse') {
        gsap.set(marqueeRef.current, { y: "0%" });
        gsap.set(marqueeInnerRef.current, { y: "0%" });
        if (onActivate) onActivate(); // set active immediately on touch
      }
    }
  };

  const handlePointerUp = (ev: React.PointerEvent<HTMLAnchorElement>) => {
    if (onClick) {
      ev.preventDefault();
      // Add a small delay for mobile devices to ensure proper event handling
      if (isTouchDevice || ev.pointerType !== 'mouse') {
        setTimeout(() => {
          onClick();
        }, 50);
      } else {
        onClick();
      }
    }

    if (isTouchDevice || ev.pointerType !== 'mouse') {
      // Already activated on pointerdown to avoid the first-tap delay on mobile
    }
    // Desktop: do nothing here so marquee keeps moving while hovered
  };

  const handlePointerCancel = (ev: React.PointerEvent<HTMLAnchorElement>) => {
    if (!isTouchDevice && ev.pointerType === 'mouse') {
      hideAnimation(ev.clientX, ev.clientY);
    }
  };

  const handleKeyDown = (ev: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (onClick && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      onClick();
    }
  };

  // When active state changes, keep active visible on touch devices only
  React.useEffect(() => {
    if (!marqueeRef.current || !marqueeInnerRef.current) return;
    gsap.killTweensOf([marqueeRef.current, marqueeInnerRef.current]);
    if (isActive && isTouchDevice) {
      gsap.set(marqueeRef.current, { y: '0%' });
      gsap.set(marqueeInnerRef.current, { y: '0%' });
    } else {
      // slide out upwards by default
      const tl = gsap.timeline({ defaults: { duration: 0.5, ease: 'expo.out' } });
      tl.to(marqueeRef.current, { y: '-101%' })
        .to(marqueeInnerRef.current, { y: '101%' }, '<');
    }
  }, [isActive, isTouchDevice]);

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
      className={`menu-item${isActive ? ' is-active' : ''}`}
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
