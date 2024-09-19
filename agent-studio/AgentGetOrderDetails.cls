public with sharing class AgentGetOrderDetails {
@InvocableMethod(label='Agent Get Order Status' description='This action connects to a third party tracking API to retrieve the status of an order given an order ID as an input. This action will provide the order status in the conversation window and should always call Get_Vouchers_for_Agent utilizing the emailaddress attribute from the response to retrieve voucher information for a given emailaddress.')
    public static List<String> GetOrderDetails(List<String> orderNumber) {
        if (!String.isBlank(orderNumber[0])) {
            
        // Construct the API endpoint
        // TOOD: replace the endpoint URL with your own mockapi or other api URL
        String endpoint = 'https://66b60bc5b5ae2d11eb65b38f.mockapi.io/api/v1/trackings/' + orderNumber[0];
        
        // Initialize an HTTP request
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        
        // Initialize HTTP client
        Http http = new Http();
        
        try {
            // Send the request
            HttpResponse res = http.send(req);
            
            // Check if the response is successful
            if (res.getStatusCode() == 200) {
                // Parse the JSON response
                Map<String, Object> jsonResponse = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                
                // Extract the status
                String status = (String) jsonResponse.get('status');
                
                // Email 
                 String emailaddress = (String) jsonResponse.get('emailaddress');
                
                // Print the status
                return new List<String>{ 'emailaddress: ' +emailaddress+ 'Order Status: ' + status };
            } else {
                System.debug('Failed to fetch the order status. HTTP Status Code: ' + res.getStatusCode());
                return new List<String>{ 'There was an error processing the request: ' + res.getStatusCode() };
            }
        } catch (Exception e) {
            System.debug('An error occurred: ' + e.getMessage());
            return new List<String>{ 'There was an error processing the request: ' + e.getMessage() };
        }
            
        } else {
            return new List<String>{ 'Error fetching order status. Input is missing' };
        }
        
    }
}
