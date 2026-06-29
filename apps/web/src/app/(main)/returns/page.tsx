import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-[72px]">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-heading-1 font-display font-bold text-center mb-4">
            Returns & Refund Policy
          </h1>
          <p className="text-body text-text-muted text-center mb-12">
            We want you to love your purchase. If you are not completely satisfied, we are here to help.
          </p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-heading-2 font-display font-semibold mb-4">
                Return Window
              </h2>
              <p className="text-body text-text-muted">
                You have <strong>30 days</strong> from the date of delivery to return most items for a full refund or exchange. 
                The item must be unworn, unwashed, and in its original condition with all tags attached.
              </p>
            </section>

            <section>
              <h2 className="text-heading-2 font-display font-semibold mb-4">
                Return Process
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-body text-text-muted">
                <li>Contact our customer service team at <a href="mailto:returns@yacfashionhouse.com" className="text-accent hover:text-accent-hover">returns@yacfashionhouse.com</a></li>
                <li>Provide your order number and reason for return</li>
                <li>Receive return authorization and shipping instructions</li>
                <li>Pack the item securely in its original packaging</li>
                <li>Ship the item back using the provided shipping label</li>
              </ol>
            </section>

            <section>
              <h2 className="text-heading-2 font-display font-semibold mb-4">
                Refund Timeline
              </h2>
              <p className="text-body text-text-muted">
                Once we receive your returned item, we will inspect it and process your refund within <strong>5-7 business days</strong>. 
                The refund will be credited to your original payment method. Please allow an additional 3-5 business days for the 
                refund to appear in your account.
              </p>
            </section>

            <section>
              <h2 className="text-heading-2 font-display font-semibold mb-4">
                Non-Returnable Items
              </h2>
              <ul className="list-disc list-inside space-y-2 text-body text-text-muted">
                <li>Underwear, swimwear, and intimate apparel (for hygiene reasons)</li>
                <li>Items marked as "Final Sale"</li>
                <li>Gift cards</li>
                <li>Customized or personalized items</li>
                <li>Items without tags or in used condition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-heading-2 font-display font-semibold mb-4">
                Exchanges
              </h2>
              <p className="text-body text-text-muted">
                We accept exchanges for a different size or color within 30 days of delivery. The fastest way to get what you want is to 
                return the original item and place a new order for the replacement item.
              </p>
            </section>

            <section>
              <h2 className="text-heading-2 font-display font-semibold mb-4">
                Damaged or Defective Items
              </h2>
              <p className="text-body text-text-muted">
                If you receive a damaged or defective item, please contact us immediately at{' '}
                <a href="mailto:support@yacfashionhouse.com" className="text-accent hover:text-accent-hover">support@yacfashionhouse.com</a> 
                {' '}with photos of the damage. We will arrange for a free replacement or full refund.
              </p>
            </section>

            <section>
              <h2 className="text-heading-2 font-display font-semibold mb-4">
                Questions?
              </h2>
              <p className="text-body text-text-muted">
                If you have any questions about our return policy, please contact our customer service team at{' '}
                <a href="mailto:support@yacfashionhouse.com" className="text-accent hover:text-accent-hover">support@yacfashionhouse.com</a>
                {' '}or visit our <Link href="/faqs" className="text-accent hover:text-accent-hover">FAQs page</Link>.
              </p>
            </section>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/shop"
              className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
