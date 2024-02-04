class calculator{
    public static void main(String[] args) {
        if (args.length != 3) {
            System.out.println("Usage: java CommandLineCalculator <number1> <operator> <number2>");
            return;
        }
        
        double num1 = Double.parseDouble(args[0]);
        String operator = args[1];
        double num2 = Double.parseDouble(args[2]);
        
        double result;
        switch (operator) {
            case "A":

                result = num1 + num2;
                break;
            case "B":
                result = num1 - num2;
                break;
            case "M":
                result = num1 * num2;
                break;
            case "D":
                if (num2 != 0) {
                    result = num1 / num2;
                } else {
                    System.out.println("Error: Division by zero!");
                    return;
                }
                break;
            default:
                System.out.println("Invalid operator. Use +, -, *, or /.");
                return;
        }

        System.out.println("Result: " + result);
        System.out.println("Kartikey uniyal 500123293 271233012");
    }
}