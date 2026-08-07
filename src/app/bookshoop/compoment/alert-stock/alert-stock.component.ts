import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, OnDestroy } from '@angular/core';

interface ProductAlert {
  name: string;
  ref: string;
  quantity: number;
  category?: string;
}

@Component({
  selector: 'app-alert-stock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-stock.component.html',
  styleUrl: './alert-stock.component.css'
})
export class AlertStockComponent implements OnDestroy {
  @Input() products: ProductAlert[] = [];
  @ViewChild('alertAudio') alertAudio!: ElementRef<HTMLAudioElement>;

  show = false;
  currentProductIndex = 0;
  animationInterval: any;
  displayDuration = 6000; // 6 secondes par produit
  isAnimating = false;

  get currentProduct(): ProductAlert | null {
    return this.products.length > 0 ? this.products[this.currentProductIndex] : null;
  }

  get hasMultipleProducts(): boolean {
    return this.products.length > 1;
  }

  get progressPercentage(): number {
    return this.products.length > 0 ? ((this.currentProductIndex + 1) / this.products.length) * 100 : 0;
  }

  display(products: ProductAlert[] | string): void {
    // Support pour l'ancien format (string) et le nouveau (array)
    if (typeof products === 'string') {
      this.products = [{ name: products,ref: "", quantity: 0 }];
    } else {
      this.products = products;
    }

    this.currentProductIndex = 0;
    this.show = true;
    this.isAnimating = false; // Reset de l'état d'animation

    // Jouer le son après un petit délai pour s'assurer que l'élément est rendu
    setTimeout(() => {
      this.playSound();
    }, 100);

    // Démarrer la rotation seulement s'il y a plusieurs produits
    if (this.hasMultipleProducts) {
      // Attendre un peu avant de commencer la rotation
      setTimeout(() => {
        this.startProductRotation();
      }, 1000); // Attendre 1 seconde avant de commencer
    }
  }

  close(): void {
    this.show = false;
    this.stopProductRotation();

    // Relancer l'alerte après 30 secondes
    setTimeout(() => {
      this.display(this.products); // relancer avec la même liste
    }, 30000); // 30000 ms = 30 sec
  }

  nextProduct(): void {
    if (this.hasMultipleProducts && !this.isAnimating) {
      this.isAnimating = true;

      // Animation de sortie
      setTimeout(() => {
        this.currentProductIndex = (this.currentProductIndex + 1) % this.products.length;
        this.isAnimating = false;
      }, 250); // Réduit le délai pour une transition plus fluide
    }
  }

  previousProduct(): void {
    if (this.hasMultipleProducts && !this.isAnimating) {
      this.isAnimating = true;

      // Animation de sortie
      setTimeout(() => {
        this.currentProductIndex = this.currentProductIndex === 0
          ? this.products.length - 1
          : this.currentProductIndex - 1;
        this.isAnimating = false;
      }, 250);
    }
  }

  private startProductRotation(): void {
    this.stopProductRotation(); // S'assurer qu'il n'y a pas d'interval existant

    // Démarrer immédiatement et répéter
    this.animationInterval = setInterval(() => {
      if (!this.isAnimating && this.hasMultipleProducts && this.show) {
        this.nextProduct();
      }
    }, this.displayDuration);
  }

  private stopProductRotation(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  private playSound(): void {
    if (this.alertAudio) {
      this.alertAudio.nativeElement.play();
    }
  }

  ngOnDestroy(): void {
    this.stopProductRotation();
  }
}