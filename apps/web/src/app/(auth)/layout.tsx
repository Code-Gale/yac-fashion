'use client';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <p className="font-display text-2xl lg:text-3xl text-accent text-center max-w-md">
          "Style is a way to say who you are without having to speak."
        </p>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        {children}
      </div>
    </div>
  );
}
