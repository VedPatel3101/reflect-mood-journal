"use client"

import React from 'react'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import testimonials from "@/data/testimonials";
import { Card, CardContent } from './ui/card';

const TestimonialCarousal = () => {
  return (
    <div className="mt-24">
        <h2 className="text-3xl font-bold text-center text-orange-900 mb-12">
            What Our Writers Say
        </h2>

         <Carousel
      plugins={[
        Autoplay({
          delay: 2000,
        }),
      ]}
    >
         <CarouselContent>
            {testimonials.map((testimonmial, index) => {
                return (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <Card className="bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <blockquote className="space-y-4">
                                <p className="text-orange-700 italic">
                                    &quot;{testimonmial.text}&quot;
                                </p>
                                <footer>
                                    <div className="text-sm text-orange-600">
                                        {testimonmial.author}</div>
                                    <div>{testimonmial.role}</div>
                                </footer>
                            </blockquote>
                        </CardContent>
                    </Card>
                </CarouselItem>
                );
            })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
    </div>
  );
};

export default TestimonialCarousal;
