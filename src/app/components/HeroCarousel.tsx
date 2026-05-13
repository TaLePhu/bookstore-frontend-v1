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
  description?: string | null;
  badge?: string;
  cta: string;
  to: string;
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
      description: 'Khám phá sách mới, sách hay và ưu đãi hấp dẫn mỗi ngày.',
      badge: 'Bookstore',
      cta: 'Khám phá ngay',
      to: '/books',
    };

    const promotionSlides = promotionBanners
      .filter((banner) => banner.image)
      .map((banner) => ({
        id: banner.id,
        image: banner.image,
        title: banner.name,
        description: banner.description,
        badge: `Giảm ${banner.discountPercent}%`,
        cta: 'Mua ngay',
        to: '/promotions',
      }));

    return [defaultSlide, ...promotionSlides];
  }, [promotionBanners]);

  const settings = {
    dots: true,
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
                className="group relative block min-h-[320px] w-full overflow-hidden bg-gray-900 text-left sm:min-h-[420px] lg:min-h-[500px]"
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10" />
                <div className="relative z-10 flex min-h-[320px] max-w-3xl flex-col justify-center px-6 py-12 text-white sm:min-h-[420px] sm:px-12 lg:min-h-[500px]">
                  {slide.badge && (
                    <div className="mb-4 inline-flex w-fit rounded-full bg-orange-500 px-4 py-2 text-sm font-bold">
                      {slide.badge}
                    </div>
                  )}
                  <h2 className="text-4xl font-bold leading-tight sm:text-6xl">{slide.title}</h2>
                  {slide.description && (
                    <p className="mt-4 max-w-2xl text-lg leading-7 text-white/90 sm:text-2xl">
                      {slide.description}
                    </p>
                  )}
                  <span className="mt-8 inline-flex w-fit rounded-full bg-white px-8 py-4 text-lg font-bold text-orange-600 transition-colors group-hover:bg-orange-50">
                    {slide.cta}
                  </span>
                </div>
              </button>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}
