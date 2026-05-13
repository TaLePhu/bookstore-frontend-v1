import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Slider from 'react-slick';
import defaultBanner from '../../assets/banner.png';
import { getPromotions, type PromotionBanner } from '../services/promotion.service';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

type HeroSlide = {
  id: string;
  image: string;
  title: string;
  to: string;
};

const isPromotionActive = (banner: PromotionBanner) => {
  const now = Date.now();
  const startsAt = banner.startsAt ? new Date(banner.startsAt).getTime() : null;
  const endsAt = banner.endsAt ? new Date(banner.endsAt).getTime() : null;

  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;

  return true;
};

export function HeroCarousel() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [promotionBanners, setPromotionBanners] = useState<PromotionBanner[]>([]);

  useEffect(() => {
    let mounted = true;

    getPromotions()
      .then((data) => {
        if (mounted) setPromotionBanners(data.banners || []);
      })
      .catch(() => {
        if (mounted) setPromotionBanners([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const slides = useMemo<HeroSlide[]>(() => {
    const defaultSlide: HeroSlide = {
      id: 'default-banner',
      image: defaultBanner,
      title: 'Nhà sách Nhi',
      to: '/',
    };

    const promotionSlides = promotionBanners
      .filter((banner) => banner.image && isPromotionActive(banner))
      .map((banner) => ({
        id: banner.id,
        image: banner.image,
        title: banner.name,
        to: `/promotions/books?program=${encodeURIComponent(banner.name)}`,
      }));

    return promotionSlides.length > 0 ? promotionSlides : [defaultSlide];
  }, [promotionBanners]);

  const settings = {
    dots: slides.length > 1,
    infinite: slides.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: slides.length > 1,
    autoplaySpeed: 5000,
    beforeChange: (_current: number, next: number) => setCurrentSlide(next),
    customPaging: (i: number) => (
      <div
        className={`h-1 w-12 rounded-full transition-all ${
          i === currentSlide ? 'bg-orange-500' : 'bg-gray-300'
        }`}
      />
    ),
    appendDots: (dots: React.ReactNode) => (
      <div className="bottom-6">
        <ul className="flex items-center justify-center gap-2"> {dots} </ul>
      </div>
    ),
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <Slider {...settings}>
          {slides.map((slide) => (
            <div key={slide.id} className="outline-none">
              <button
                type="button"
                onClick={() => navigate(slide.to)}
                className="group relative block aspect-[16/7] w-full overflow-hidden bg-gray-100 text-left"
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </button>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}
