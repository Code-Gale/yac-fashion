import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const faqs = [
  {
    question: 'How long does shipping take?',
    answer:
      'Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 business days delivery.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in their original condition with tags attached.',
  },
  {
    question: 'Do you offer international shipping?',
    answer:
      'Currently, we only ship within Nigeria. We are working on expanding our international shipping options.',
  },
  {
    question: 'How can I track my order?',
    answer:
      "Once your order ships, you'll receive a tracking number via email. You can also view your order status in your account dashboard.",
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, debit cards, Paystack, cash on delivery, and bank transfer.',
  },
  {
    question: 'How do I know what size to order?',
    answer:
      "Each product page has a detailed size guide. If you're between sizes, we recommend sizing up for a more comfortable fit.",
  },
  {
    question: 'Can I modify or cancel my order?',
    answer:
      'Orders can be modified or cancelled within 1 hour of placement. After that, please contact our customer service team for assistance.',
  },
  {
    question: 'Do you offer gift wrapping?',
    answer:
      'Yes! Gift wrapping is available at checkout for a small additional fee.',
  },
];

export default function FAQsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-[72px]">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-heading-1 font-display font-bold text-center mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-body text-text-muted text-center mb-12">
            Find answers to common questions about orders, shipping, and returns.
          </p>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-surface border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-primary mb-2">{faq.question}</h2>
                <p className="text-body text-text-muted">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-body text-text-muted mb-4">
              Cannot find what you are looking for?
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
